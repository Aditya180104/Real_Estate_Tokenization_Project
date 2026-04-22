import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin, TrendingUp, Users, Layers, Shield, FileText,
  Wallet, ChevronLeft, ExternalLink, Home, DollarSign,
} from "lucide-react";
import { ethers } from "ethers";
import toast from "react-hot-toast";
import api from "../../services/api";
import useAuthStore from "../../store/authStore";
import useWalletStore from "../../store/walletStore";
import { PageLoader } from "../../components/ui/LoadingSpinner";
import Modal from "../../components/ui/Modal";
import platformABI from "../../blockchain/RealEstatePlatform.json";

const statusConfig = {
  active: { label: "Active & Trading", className: "badge-green" },
  pending_review: { label: "Pending Review", className: "badge-yellow" },
  verified: { label: "Verified", className: "badge-blue" },
  suspended: { label: "Suspended", className: "badge-red" },
  draft: { label: "Draft", className: "badge-gray" },
};

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { isConnected, address, signer, connect } = useWalletStore();
  const [buyModal, setBuyModal] = useState(false);
  const [shareAmount, setShareAmount] = useState(1);
  const [isBuying, setIsBuying] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data } = await api.get(`/properties/${id}`);
      return data.data;
    },
  });

  if (isLoading) return <PageLoader />;
  if (error || !data) return (
    <div className="page-container text-center py-20">
      <p className="text-slate-400">Property not found.</p>
    </div>
  );

  const property = data;
  const status = statusConfig[property.status] || statusConfig.draft;
  const totalCost = shareAmount * (property.financials?.pricePerShare || 0);
  const isOwner = user?._id === property.owner?._id;
  const canBuy = isAuthenticated && !isOwner && property.status === "active" && user?.kycStatus === "verified";

  const handleBuyShares = async () => {
    if (!isConnected) {
      await connect();
      return;
    }

    if (!property.tokenization?.contractAddress) {
      toast.error("Property is not yet tokenized on-chain");
      return;
    }

    setIsBuying(true);
    try {
      const contract = new ethers.Contract(
        platformABI.address,
        platformABI.abi,
        signer
      );

      const pricePerShareWei = property.financials?.pricePerShareWei ||
        ethers.parseEther((property.financials.pricePerShare / 1000).toString());

      const platformFeePercent = 250n; // 2.5%
      const totalCostWei = BigInt(shareAmount) * BigInt(pricePerShareWei);
      const platformFee = (totalCostWei * platformFeePercent) / 10000n;
      const totalWithFee = totalCostWei + platformFee;

      const tx = await contract.buyShares(
        property.tokenization.blockchainPropertyId,
        shareAmount,
        { value: totalWithFee }
      );

      toast.loading("Transaction submitted, waiting for confirmation...", { id: "buy-tx" });
      const receipt = await tx.wait();
      toast.success("Shares purchased successfully!", { id: "buy-tx" });

      // Record in backend
      await api.post("/transactions/record", {
        propertyId: property._id,
        transactionType: "purchase",
        shares: shareAmount,
        amountUSD: totalCost,
        amountWei: totalCostWei.toString(),
        pricePerShareUSD: property.financials.pricePerShare,
        pricePerShareWei: pricePerShareWei.toString(),
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        toAddress: property.owner?.walletAddress,
      });

      setBuyModal(false);
    } catch (err) {
      toast.error(err.reason || err.message || "Transaction failed", { id: "buy-tx" });
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Properties
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image gallery */}
          <div className="card overflow-hidden">
            <div className="relative h-72 sm:h-96 bg-slate-800">
              {property.images?.[activeImage] ? (
                <img
                  src={property.images[activeImage].url}
                  alt={property.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800"; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <Home className="w-20 h-20" />
                </div>
              )}
              <div className="absolute top-4 left-4 flex gap-2">
                <span className={status.className}>{status.label}</span>
                {property.featured && <span className="badge bg-gold-500/20 text-gold-400 border border-gold-500/30">Featured</span>}
              </div>
            </div>
            {property.images?.length > 1 && (
              <div className="flex gap-2 p-3 overflow-x-auto">
                {property.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      i === activeImage ? "border-primary-500" : "border-transparent"
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200"; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-100 mb-1">{property.title}</h1>
                <div className="flex items-center gap-1 text-slate-400 text-sm">
                  <MapPin className="w-4 h-4" />
                  {property.location?.address}, {property.location?.city}, {property.location?.state}, {property.location?.country}
                </div>
              </div>
              <span className="badge-blue capitalize flex-shrink-0">{property.propertyType?.replace("_", " ")}</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">{property.description}</p>

            {/* Property specs */}
            {(property.details?.bedrooms || property.details?.area) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
                {property.details?.bedrooms && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-100">{property.details.bedrooms}</p>
                    <p className="text-xs text-slate-500">Bedrooms</p>
                  </div>
                )}
                {property.details?.bathrooms && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-100">{property.details.bathrooms}</p>
                    <p className="text-xs text-slate-500">Bathrooms</p>
                  </div>
                )}
                {property.details?.area && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-100">{property.details.area?.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">Sq Ft</p>
                  </div>
                )}
                {property.details?.yearBuilt && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-slate-100">{property.details.yearBuilt}</p>
                    <p className="text-xs text-slate-500">Year Built</p>
                  </div>
                )}
              </div>
            )}

            {/* Amenities */}
            {property.details?.amenities?.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {property.details.amenities.map((a) => (
                    <span key={a} className="badge-gray">{a}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Documents */}
          {property.documents?.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-400" />
                Documents
              </h3>
              <div className="space-y-2">
                {property.documents.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-300">{doc.name}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-primary-400 transition-colors" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Blockchain info */}
          {property.tokenization?.isTokenized && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                On-Chain Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-sm text-slate-500">Token Name</span>
                  <span className="text-sm text-slate-300 font-mono">{property.tokenization.tokenName}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-800">
                  <span className="text-sm text-slate-500">Token Symbol</span>
                  <span className="text-sm text-slate-300 font-mono">{property.tokenization.tokenSymbol}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-slate-500">Contract Address</span>
                  <a
                    href={`https://sepolia.etherscan.io/address/${property.tokenization.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary-400 hover:text-primary-300 font-mono flex items-center gap-1"
                  >
                    {property.tokenization.contractAddress?.slice(0, 10)}...
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              {data?.blockchainData && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Available Shares</p>
                    <p className="text-sm font-bold text-slate-100">{data.blockchainData.availableShares}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">Shareholders</p>
                    <p className="text-sm font-bold text-slate-100">{data.blockchainData.shareholderCount}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column — Investment panel */}
        <div className="space-y-6">
          <div className="card p-6 sticky top-24">
            <div className="mb-6">
              <p className="text-sm text-slate-500 mb-1">Price per share</p>
              <p className="text-3xl font-extrabold text-slate-100">
                ${property.financials?.pricePerShare?.toLocaleString()}
              </p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Property Value</span>
                <span className="text-slate-300 font-medium">${(property.financials?.totalValue / 1000000).toFixed(2)}M</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Shares</span>
                <span className="text-slate-300 font-medium">{property.financials?.totalShares?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Expected Annual Return</span>
                <span className="text-emerald-400 font-bold">{property.financials?.expectedAnnualReturn}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Monthly Rental Income</span>
                <span className="text-slate-300 font-medium">${property.financials?.rentalIncome?.toLocaleString()}/mo</span>
              </div>
            </div>

            {canBuy ? (
              <button
                onClick={() => setBuyModal(true)}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                <DollarSign className="w-4 h-4" />
                Buy Shares
              </button>
            ) : !isAuthenticated ? (
              <a href="/login" className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                Login to Invest
              </a>
            ) : isOwner ? (
              <div className="text-center text-sm text-slate-500 py-3">You own this property</div>
            ) : user?.kycStatus !== "verified" ? (
              <div className="text-center text-sm text-amber-400 py-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                KYC verification required to invest
              </div>
            ) : (
              <div className="text-center text-sm text-slate-500 py-3">Trading not available</div>
            )}

            {/* Owner info */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-xs text-slate-500 mb-2">Listed by</p>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-gold-500 flex items-center justify-center text-white text-xs font-bold">
                  {property.owner?.firstName?.[0]}{property.owner?.lastName?.[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-300">
                    {property.owner?.firstName} {property.owner?.lastName}
                  </p>
                  <p className="text-xs text-slate-500">Verified Owner</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buy Modal */}
      <Modal isOpen={buyModal} onClose={() => setBuyModal(false)} title="Purchase Shares">
        <div className="space-y-6">
          <div className="card p-4">
            <p className="text-sm font-semibold text-slate-300 mb-1">{property.title}</p>
            <p className="text-xs text-slate-500">{property.location?.city}, {property.location?.country}</p>
          </div>

          <div>
            <label className="label">Number of Shares</label>
            <input
              type="number"
              min={1}
              max={property.financials?.totalShares}
              value={shareAmount}
              onChange={(e) => setShareAmount(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-field"
            />
          </div>

          <div className="card p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Price per share</span>
              <span className="text-slate-300">${property.financials?.pricePerShare?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Shares</span>
              <span className="text-slate-300">× {shareAmount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Platform fee (2.5%)</span>
              <span className="text-slate-300">${(totalCost * 0.025).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-700">
              <span className="text-slate-300">Total</span>
              <span className="text-primary-400">${(totalCost * 1.025).toFixed(2)}</span>
            </div>
          </div>

          {!isConnected && (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm">
              <Wallet className="w-4 h-4 flex-shrink-0" />
              MetaMask wallet required for on-chain purchase
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setBuyModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleBuyShares}
              disabled={isBuying}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {isBuying ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  {isConnected ? "Confirm Purchase" : "Connect & Buy"}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
