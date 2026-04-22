import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, Plus, X, Building2, MapPin, DollarSign, FileText } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const steps = ["Basic Info", "Location", "Financials", "Media & Docs"];

export default function AddPropertyPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [amenityInput, setAmenityInput] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    propertyType: "residential",
    address: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    yearBuilt: "",
    amenities: [],
    totalValue: "",
    totalShares: "",
    pricePerShare: "",
    expectedAnnualReturn: "",
    rentalIncome: "",
    tokenName: "",
    tokenSymbol: "",
    tags: "",
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const addAmenity = () => {
    if (amenityInput.trim() && !form.amenities.includes(amenityInput.trim())) {
      set("amenities", [...form.amenities, amenityInput.trim()]);
      setAmenityInput("");
    }
  };

  const removeAmenity = (a) => set("amenities", form.amenities.filter((x) => x !== a));

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files].slice(0, 10));
  };

  const handleDocChange = (e) => {
    const files = Array.from(e.target.files);
    setDocuments((prev) => [...prev, ...files].slice(0, 5));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          formData.append(k, JSON.stringify(v));
        } else if (v !== "") {
          formData.append(k, v);
        }
      });
      images.forEach((img) => formData.append("images", img));
      documents.forEach((doc) => formData.append("documents", doc));

      await api.post("/properties", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Property submitted for review!");
      navigate("/owner/properties");
    } catch {
      // Error handled by interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepIcons = [Building2, MapPin, DollarSign, FileText];

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Add New Property</h1>
        <p className="text-slate-500 mt-1 text-sm">List your property for tokenization and fractional investment</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => {
          const Icon = stepIcons[i];
          return (
            <div key={s} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  i === step
                    ? "bg-primary-600 text-white"
                    : i < step
                    ? "bg-emerald-500/20 text-emerald-400 cursor-pointer"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{s}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < step ? "bg-emerald-500/50" : "bg-slate-800"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="card p-8">
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-100 mb-6">Basic Information</h2>
            <div>
              <label className="label">Property Title *</label>
              <input type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. Luxury Downtown Apartment Complex" className="input-field" required />
            </div>
            <div>
              <label className="label">Description *</label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)}
                placeholder="Describe the property, its features, and investment potential..."
                className="input-field min-h-[120px] resize-none" required />
            </div>
            <div>
              <label className="label">Property Type *</label>
              <select value={form.propertyType} onChange={(e) => set("propertyType", e.target.value)} className="input-field">
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="land">Land</option>
                <option value="mixed_use">Mixed Use</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Bedrooms</label>
                <input type="number" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)}
                  placeholder="0" className="input-field" min="0" />
              </div>
              <div>
                <label className="label">Bathrooms</label>
                <input type="number" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)}
                  placeholder="0" className="input-field" min="0" />
              </div>
              <div>
                <label className="label">Area (sq ft)</label>
                <input type="number" value={form.area} onChange={(e) => set("area", e.target.value)}
                  placeholder="0" className="input-field" min="0" />
              </div>
              <div>
                <label className="label">Year Built</label>
                <input type="number" value={form.yearBuilt} onChange={(e) => set("yearBuilt", e.target.value)}
                  placeholder="2020" className="input-field" />
              </div>
            </div>
            <div>
              <label className="label">Amenities</label>
              <div className="flex gap-2 mb-2">
                <input type="text" value={amenityInput} onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAmenity())}
                  placeholder="e.g. Pool, Gym, Parking" className="input-field flex-1" />
                <button type="button" onClick={addAmenity} className="btn-secondary px-4">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.amenities.map((a) => (
                  <span key={a} className="badge-blue flex items-center gap-1">
                    {a}
                    <button onClick={() => removeAmenity(a)} className="hover:text-red-400 ml-1">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Location */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-100 mb-6">Location Details</h2>
            <div>
              <label className="label">Street Address *</label>
              <input type="text" value={form.address} onChange={(e) => set("address", e.target.value)}
                placeholder="123 Main Street" className="input-field" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">City *</label>
                <input type="text" value={form.city} onChange={(e) => set("city", e.target.value)}
                  placeholder="New York" className="input-field" required />
              </div>
              <div>
                <label className="label">State / Province</label>
                <input type="text" value={form.state} onChange={(e) => set("state", e.target.value)}
                  placeholder="NY" className="input-field" />
              </div>
              <div>
                <label className="label">Country *</label>
                <input type="text" value={form.country} onChange={(e) => set("country", e.target.value)}
                  placeholder="USA" className="input-field" required />
              </div>
              <div>
                <label className="label">ZIP / Postal Code</label>
                <input type="text" value={form.zipCode} onChange={(e) => set("zipCode", e.target.value)}
                  placeholder="10001" className="input-field" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Financials */}
        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold text-slate-100 mb-6">Financial Details & Tokenization</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Total Property Value (USD) *</label>
                <input type="number" value={form.totalValue} onChange={(e) => set("totalValue", e.target.value)}
                  placeholder="1000000" className="input-field" required min="1" />
              </div>
              <div>
                <label className="label">Total Shares *</label>
                <input type="number" value={form.totalShares} onChange={(e) => set("totalShares", e.target.value)}
                  placeholder="1000" className="input-field" required min="1" />
              </div>
              <div>
                <label className="label">Price per Share (USD) *</label>
                <input type="number" value={form.pricePerShare} onChange={(e) => set("pricePerShare", e.target.value)}
                  placeholder="1000" className="input-field" required min="1" />
              </div>
              <div>
                <label className="label">Expected Annual Return (%)</label>
                <input type="number" value={form.expectedAnnualReturn} onChange={(e) => set("expectedAnnualReturn", e.target.value)}
                  placeholder="8.5" className="input-field" step="0.1" />
              </div>
              <div>
                <label className="label">Monthly Rental Income (USD)</label>
                <input type="number" value={form.rentalIncome} onChange={(e) => set("rentalIncome", e.target.value)}
                  placeholder="5000" className="input-field" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-sm font-semibold text-slate-300 mb-4">Token Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Token Name</label>
                  <input type="text" value={form.tokenName} onChange={(e) => set("tokenName", e.target.value)}
                    placeholder="Manhattan Property Token" className="input-field" />
                </div>
                <div>
                  <label className="label">Token Symbol</label>
                  <input type="text" value={form.tokenSymbol} onChange={(e) => set("tokenSymbol", e.target.value)}
                    placeholder="MPT" className="input-field" maxLength={6} />
                </div>
              </div>
            </div>

            {form.totalValue && form.totalShares && (
              <div className="card p-4 bg-primary-500/5 border-primary-500/20">
                <p className="text-xs text-slate-500 mb-2">Calculated price per share</p>
                <p className="text-lg font-bold text-primary-400">
                  ${(Number(form.totalValue) / Number(form.totalShares)).toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Media */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-slate-100 mb-6">Images & Documents</h2>

            {/* Images */}
            <div>
              <label className="label">Property Images (up to 10)</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-primary-500/50 hover:bg-primary-500/5 transition-all">
                <Upload className="w-8 h-8 text-slate-600 mb-2" />
                <span className="text-sm text-slate-500">Click to upload images</span>
                <span className="text-xs text-slate-600 mt-1">JPEG, PNG, WebP up to 10MB each</span>
                <input type="file" multiple accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {images.map((img, i) => (
                    <div key={i} className="relative">
                      <img src={URL.createObjectURL(img)} alt="" className="w-16 h-16 rounded-lg object-cover" />
                      <button
                        onClick={() => setImages(images.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Documents */}
            <div>
              <label className="label">Property Documents (up to 5)</label>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-primary-500/50 hover:bg-primary-500/5 transition-all">
                <FileText className="w-8 h-8 text-slate-600 mb-2" />
                <span className="text-sm text-slate-500">Upload title deeds, inspection reports, etc.</span>
                <span className="text-xs text-slate-600 mt-1">PDF, DOC, DOCX up to 10MB each</span>
                <input type="file" multiple accept=".pdf,.doc,.docx,image/*" onChange={handleDocChange} className="hidden" />
              </label>
              {documents.length > 0 && (
                <div className="space-y-2 mt-3">
                  {documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-800 rounded-xl">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-300 truncate max-w-[200px]">{doc.name}</span>
                      </div>
                      <button onClick={() => setDocuments(documents.filter((_, j) => j !== i))}
                        className="text-slate-500 hover:text-red-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="label">Tags (comma separated)</label>
              <input type="text" value={form.tags} onChange={(e) => set("tags", e.target.value)}
                placeholder="luxury, downtown, high-yield" className="input-field" />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-800">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="btn-secondary disabled:opacity-30"
          >
            Previous
          </button>

          {step < steps.length - 1 ? (
            <button onClick={() => setStep((s) => s + 1)} className="btn-primary">
              Next Step
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-primary flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              Submit for Review
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
