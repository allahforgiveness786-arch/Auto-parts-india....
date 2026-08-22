import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  ArrowLeft,
  UploadCloud, 
  Check, 
  Camera, 
  Image as ImageIcon, 
  Sparkles, 
  AlertCircle, 
  FileText, 
  Compass, 
  MapPin, 
  Layers, 
  Phone, 
  User as UserIcon,
  Trash2,
  Car,
  Tag,
  SlidersHorizontal,
  Info,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { SparePart, INDIAN_CAR_BRANDS, CAR_PART_CATEGORIES, CAR_SPARE_PARTS_BY_CATEGORY, DEFAULT_MODEL_VARIANTS } from "../types";
import { INDIAN_STATES_AND_DISTRICTS } from "../data/indianLocations";
import { uploadProductImage, fetchFullTaxonomyConfig, subscribeToTaxonomyConfig, deleteSparePartListing } from "../lib/firebase";
import { useLanguage } from "../lib/LanguageContext";
import { translateDynamic } from "../lib/translations";
import MapLocationModal from "./MapLocationModal";
import GMap from "./GMap";
import { getApproxCoordinates, reverseGeocodeLatLng } from "../utils/locationHelper";
import { requestCameraPermissionJIT } from "../utils/permissionUtils";
import { compressImageFile } from "../utils/imageCompressor";
import CameraCaptureModal from "./CameraCaptureModal";
import ImageSourceActionModal from "./ImageSourceActionModal";

interface EditListingModalProps {
  part: SparePart;
  onClose: () => void;
  onSave: (partId: string, updates: Partial<SparePart>) => Promise<void>;
  onDelete?: (partId: string) => Promise<void>;
}

export default function EditListingModal({ part, onClose, onSave, onDelete }: EditListingModalProps) {
  const { t, language } = useLanguage();
  const [title, setTitle] = useState(part.title || "");
  const [description, setDescription] = useState(part.description || "");
  const [price, setPrice] = useState(part.price !== undefined && part.price !== null ? String(part.price) : "");
  const [carBrand, setCarBrand] = useState(part.carBrand || "");
  const [carModel, setCarModel] = useState(part.carModel || "");
  const [carVariant, setCarVariant] = useState(part.carVariant || "");
  const [category, setCategory] = useState(part.category || "");
  const [partName, setPartName] = useState(part.partName || "");
  const [condition, setCondition] = useState<"Brand New" | "Like New" | "Used (Good)" | "For Scrap/Spares">(part.condition || "Brand New");
  const [selectedState, setSelectedState] = useState(part.state || "");
  const [selectedDistrict, setSelectedDistrict] = useState(part.district || "");
  const [selectedArea, setSelectedArea] = useState(part.area || "");
  const [contactName, setContactName] = useState(part.contactName || part.sellerName || "");
  const [contactPhone, setContactPhone] = useState(part.contactPhone || "");
  
  const [uploadedImages, setUploadedImages] = useState<string[]>(() => {
    if (part.imageUrls && part.imageUrls.length > 0) return part.imageUrls.filter(Boolean);
    if (part.images && part.images.length > 0) return part.images.filter(Boolean);
    if (part.imageUrl) return [part.imageUrl];
    return [];
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [directImageUrlInput, setDirectImageUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Dynamic taxonomy state
  const [taxonomy, setTaxonomy] = useState<{
    categories: string[];
    brands: Record<string, string[]>;
    subcategories: Record<string, string[]>;
    variants: Record<string, string[]>;
    states: string[];
    districts: Record<string, string[]>;
  }>({
    categories: [],
    brands: {},
    subcategories: {},
    variants: {},
    states: [],
    districts: {}
  });

  useEffect(() => {
    const unsub = subscribeToTaxonomyConfig((full) => {
      setTaxonomy({
        categories: full.categories || [],
        brands: full.brands || {},
        subcategories: full.subcategories || {},
        variants: full.variants || {},
        states: full.states || [],
        districts: full.districts || {}
      });
    });
    return () => unsub();
  }, []);

  // Coordinates State
  const [lat, setLat] = useState<number | undefined>(part.lat);
  const [lng, setLng] = useState<number | undefined>(part.lng);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const nativeGalleryInputRef = useRef<HTMLInputElement>(null);

  // Sync local states if part prop changes
  useEffect(() => {
    if (part) {
      setTitle(part.title || "");
      setDescription(part.description || "");
      setPrice(part.price !== undefined && part.price !== null ? String(part.price) : "");
      setCarBrand(part.carBrand || "");
      setCarModel(part.carModel || "");
      setCarVariant(part.carVariant || "");
      setCategory(part.category || "");
      setPartName(part.partName || "");
      setCondition(part.condition || "Brand New");
      setSelectedState(part.state || "");
      setSelectedDistrict(part.district || "");
      setSelectedArea(part.area || "");
      setContactName(part.contactName || part.sellerName || "");
      setContactPhone(part.contactPhone || "");
      setUploadedImages(
        part.imageUrls && part.imageUrls.length > 0
          ? part.imageUrls.filter(Boolean)
          : part.images && part.images.length > 0
          ? part.images.filter(Boolean)
          : part.imageUrl
          ? [part.imageUrl]
          : []
      );
      setLat(part.lat);
      setLng(part.lng);
    }
  }, [part]);

  // Robust options with immediate fallback to static data and pre-filled current values
  const allBrands = Object.keys(taxonomy.brands || {}).length > 0 
    ? Object.keys(taxonomy.brands) 
    : Object.keys(INDIAN_CAR_BRANDS);
  const brandOptions = Array.from(new Set([carBrand, ...allBrands])).filter(Boolean);

  const fallbackModels = carBrand && (INDIAN_CAR_BRANDS as any)[carBrand] ? (INDIAN_CAR_BRANDS as any)[carBrand] : [];
  const dynamicModels = carBrand && taxonomy.brands ? taxonomy.brands[carBrand] || [] : [];
  const allModels = dynamicModels.length > 0 ? dynamicModels : fallbackModels;
  const modelOptions = Array.from(new Set([carModel, ...allModels])).filter(Boolean);

  const dynamicVariants = carModel 
    ? (taxonomy.variants?.[carModel] || taxonomy.variants?.[`${carBrand}_${carModel}`] || []) 
    : [];
  const fallbackVariants = (carModel && DEFAULT_MODEL_VARIANTS[carModel]) 
    ? DEFAULT_MODEL_VARIANTS[carModel] 
    : ["Base", "Mid", "Top Spec", "VXi", "ZXi", "SX", "Alpha", "GT", "LXi"];
  const allVariants = Array.isArray(dynamicVariants) && dynamicVariants.length > 0 
    ? dynamicVariants 
    : Array.isArray(fallbackVariants) 
    ? fallbackVariants 
    : ["Base", "Mid", "Top Spec", "VXi", "ZXi", "SX", "Alpha", "GT", "LXi"];
  const variantOptions = Array.from(new Set([carVariant, ...allVariants])).filter(Boolean);

  const dynamicCategories = taxonomy.categories || [];
  const allCategories = dynamicCategories.length > 0 ? dynamicCategories : CAR_PART_CATEGORIES;
  const categoryOptions = Array.from(new Set([category, ...allCategories])).filter(Boolean);

  const dynamicParts = category && taxonomy.subcategories ? taxonomy.subcategories[category] || [] : [];
  const fallbackParts = category && (CAR_SPARE_PARTS_BY_CATEGORY as any)[category] ? (CAR_SPARE_PARTS_BY_CATEGORY as any)[category] : [];
  const allParts = dynamicParts.length > 0 ? dynamicParts : fallbackParts;
  const partNameOptions = Array.from(new Set([partName, ...allParts])).filter(Boolean);

  const dynamicStates = taxonomy.states || [];
  const fallbackStates = INDIAN_STATES_AND_DISTRICTS.map((s) => s.state);
  const allStates = dynamicStates.length > 0 ? dynamicStates : fallbackStates;
  const stateOptions = Array.from(new Set([selectedState, ...allStates])).filter(Boolean);

  const dynamicDistricts = selectedState && taxonomy.districts ? taxonomy.districts[selectedState] || [] : [];
  const fallbackDistricts = selectedState ? (INDIAN_STATES_AND_DISTRICTS.find((s) => s.state === selectedState)?.districts || []) : [];
  const allDistricts = dynamicDistricts.length > 0 ? dynamicDistricts : fallbackDistricts;
  const districtOptions = Array.from(new Set([selectedDistrict, ...allDistricts])).filter(Boolean);

  const formatIndianCurrency = (val: string | number | undefined | null) => {
    if (val === undefined || val === null || val === "") return "";
    const clean = String(val).replace(/[^0-9]/g, "");
    if (!clean) return "";
    const num = parseInt(clean, 10);
    if (isNaN(num)) return "";
    return num.toLocaleString("en-IN");
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const rawDigits = raw.replace(/[^0-9]/g, "");
    setPrice(rawDigits);
  };

  const handleBrandChange = (brand: string) => {
    setCarBrand(brand);
    setCarModel("");
    setCarVariant("");
  };

  const handleModelChange = (model: string) => {
    setCarModel(model);
    setCarVariant("");
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setPartName("");
  };

  const handlePhotoPickerClick = async (e: React.MouseEvent) => {
    const res = await requestCameraPermissionJIT();
    if (!res.granted) {
      e.preventDefault();
      setError(res.message || "Camera & Photos permission is needed to attach spare part images.");
    }
  };

  const handleCameraCapture = async (base64Data: string) => {
    if (uploadedImages.length >= 6) {
      setError("Maximum 6 images allowed.");
      return;
    }
    setIsUploading(true);
    setError(null);
    setUploadProgress("Uploading photo...");
    try {
      let finalUrl = base64Data;
      try {
        const cloudinaryUrl = await uploadProductImage(base64Data);
        if (cloudinaryUrl) finalUrl = cloudinaryUrl;
      } catch (uploadErr) {
        console.warn("Cloudinary upload failed, using local base64 fallback:", uploadErr);
      }
      setUploadedImages(prev => [...prev, finalUrl]);
    } catch (err: any) {
      setError(err.message || "Failed to process camera photo.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleFilesSelectFromModal = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (files.length > 6 || uploadedImages.length + files.length > 6) {
      setError("Maximum 6 images allowed.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const uploadedUrls: string[] = [];
    const initialCount = uploadedImages.length;
    const totalFiles = files.length;

    try {
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const currentProgressNum = initialCount + i + 1;
        setUploadProgress(`Uploading photo ${currentProgressNum} of 6...`);

        const base64Data = await compressImageFile(file, 800, 800, 0.8, 300 * 1024);
        try {
          const cloudinaryUrl = await uploadProductImage(base64Data);
          uploadedUrls.push(cloudinaryUrl || base64Data);
        } catch (uploadErr) {
          console.warn("Cloudinary upload failed/timeout; using compressed image fallback:", uploadErr);
          uploadedUrls.push(base64Data);
        }
      }
      setUploadedImages(prev => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      setError(err.message || "Failed to process one or more images. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleImageFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length > 6 || uploadedImages.length + files.length > 6) {
      setError("Maximum 6 images allowed.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const uploadedUrls: string[] = [];
    const initialCount = uploadedImages.length;
    const totalFiles = files.length;

    try {
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        const currentProgressNum = initialCount + i + 1;
        setUploadProgress(`Uploading photo ${currentProgressNum} of 6...`);

        // Client-side compression to max 800px width/height and < 300KB
        const base64Data = await compressImageFile(file, 800, 800, 0.8, 300 * 1024);
        try {
          const cloudinaryUrl = await uploadProductImage(base64Data);
          uploadedUrls.push(cloudinaryUrl || base64Data);
        } catch (uploadErr) {
          console.warn("Cloudinary upload failed/timeout; using compressed image fallback:", uploadErr);
          uploadedUrls.push(base64Data);
        }
      }
      setUploadedImages(prev => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      setError(err.message || "Failed to process one or more images. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  const handleAddDirectUrl = () => {
    const url = directImageUrlInput.trim();
    if (!url) return;
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("data:image/")) {
      setError("Please enter a valid image URL (e.g. https://... or data:image/...)");
      return;
    }
    if (uploadedImages.length >= 6) {
      setError("Maximum 6 images allowed.");
      return;
    }
    setError(null);
    setUploadedImages(prev => [...prev, url]);
    setDirectImageUrlInput("");
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0 || index >= uploadedImages.length) return;
    setUploadedImages(prev => {
      const copy = [...prev];
      const [selected] = copy.splice(index, 1);
      return [selected, ...copy];
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Please enter an Ad Title.");
      return;
    }
    if (!description.trim()) {
      setError("Please provide a description of the spare part.");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      setError("Please enter a valid selling price in ₹.");
      return;
    }
    if (!carBrand) {
      setError("Please select a Car Brand.");
      return;
    }
    if (!carModel) {
      setError("Please select or enter the Car Model.");
      return;
    }
    if (!category) {
      setError("Please select a Part Category.");
      return;
    }
    if (!partName) {
      setError("Please specify the Part Name.");
      return;
    }
    if (!selectedState) {
      setError("Please select the State.");
      return;
    }
    if (!selectedDistrict) {
      setError("Please select the District.");
      return;
    }
    if (!contactName.trim()) {
      setError("Please enter your Contact/Seller Name.");
      return;
    }
    if (!contactPhone.trim()) {
      setError("Please enter a Contact Phone Number.");
      return;
    }

    if (uploadedImages.length === 0) {
      setError("Please upload at least one photo of the spare part.");
      return;
    }

    const cleanPriceDigits = String(price).replace(/[^0-9.]/g, "");
    const priceNum = parseFloat(cleanPriceDigits);
    if (!cleanPriceDigits || isNaN(priceNum) || priceNum <= 0) {
      setError("Please specify a valid positive price in ₹.");
      return;
    }

    setIsSaving(true);

    try {
      let finalLat = lat;
      let finalLng = lng;
      if (finalLat === undefined || finalLng === undefined || finalLat === 0 || finalLng === 0) {
        const approx = getApproxCoordinates(selectedState, selectedDistrict);
        finalLat = approx.lat;
        finalLng = approx.lng;
      }

      const primaryImage = uploadedImages[0] || "";
      const readableLoc = selectedArea.trim()
        ? `${selectedArea.trim()}, ${selectedDistrict}`
        : `${selectedDistrict}, ${selectedState}`;

      const updates: Partial<SparePart> = {
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        carBrand: carBrand.trim(),
        carModel: carModel.trim(),
        carVariant: carVariant ? carVariant.trim() : "",
        category: category.trim(),
        partName: partName.trim(),
        condition,
        location: readableLoc,
        state: selectedState,
        district: selectedDistrict,
        area: selectedArea.trim() || undefined,
        lat: finalLat !== undefined ? finalLat : 0,
        lng: finalLng !== undefined ? finalLng : 0,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        imageUrl: primaryImage,
        imageUrls: uploadedImages || [],
        images: uploadedImages || []
      };

      await onSave(part.id, updates);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save changes. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmPermanentDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      if (onDelete) {
        await onDelete(part.id);
      } else {
        await deleteSparePartListing(part.id);
      }
      setShowDeleteConfirm(false);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to delete listing.");
      setIsDeleting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col text-slate-900 dark:text-slate-100 overflow-hidden animate-in fade-in duration-150"
      id="edit-listing-screen-container"
    >
      {/* Top App Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="p-2 -ml-1 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
              id="edit-listing-back-btn"
              title="Go Back"
            >
              <ArrowLeft size={22} strokeWidth={2.5} />
            </button>
            <div>
              <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                Edit Ad
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Update your spare part details and price
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSaving || isUploading || isDeleting}
              className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-blue-700 active:scale-95 text-white font-black text-xs rounded-xl uppercase tracking-wider shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              id="edit-screen-top-save-btn"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={14} strokeWidth={3} />
                  <span>Save</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto pb-36 px-4 sm:px-6 pt-4" id="edit-listing-scrollable-body">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
          
          {/* Error Banner */}
          {error && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 shadow-xs animate-in slide-in-from-top-2 duration-200">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="flex-1">
                <p className="font-bold">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-rose-500 hover:text-rose-700 p-1"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Section 1: Photos & Media */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className="text-[#2563EB]" />
                <div>
                  <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Product Photos
                  </h2>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Upload up to 6 photos. First photo is primary.
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-[#2563EB] bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                {uploadedImages.length}/6
              </span>
            </div>

            {/* Photos Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 pt-1">
              {uploadedImages.map((img, idx) => (
                <div 
                  key={idx} 
                  className="group relative aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden shadow-xs border border-slate-200 dark:border-slate-700"
                >
                  <img 
                    src={img} 
                    alt={`Photo ${idx + 1}`} 
                    className="w-full h-full object-cover" 
                  />
                  
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-slate-900/80 hover:bg-rose-600 text-white rounded-md transition-colors cursor-pointer z-10"
                    title="Remove Photo"
                  >
                    <X size={12} />
                  </button>

                  {/* Primary Badge or Make Primary Action */}
                  {idx === 0 ? (
                    <div className="absolute bottom-0 inset-x-0 bg-[#2563EB] text-white text-[9px] font-black tracking-wider text-center py-0.5 uppercase shadow-xs">
                      Primary
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryImage(idx)}
                      className="absolute bottom-0 inset-x-0 bg-slate-900/75 hover:bg-[#2563EB] text-white text-[8px] font-bold tracking-wider text-center py-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer uppercase"
                    >
                      Set Primary
                    </button>
                  )}
                </div>
              ))}

              {/* Direct Native Camera & Gallery Slots/Buttons */}
              {uploadedImages.length < 6 && (
                <div className="aspect-square flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => nativeCameraInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1 rounded-t-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 flex items-center justify-center gap-1 text-blue-700 dark:text-blue-400 transition-all cursor-pointer p-1"
                    title="Take photo with camera"
                    id="btn-edit-add-camera"
                  >
                    <Camera size={13} />
                    <span className="text-[9px] font-bold">Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => nativeGalleryInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex-1 rounded-b-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-1 text-slate-700 dark:text-slate-300 transition-all cursor-pointer p-1"
                    title="Select from gallery"
                    id="btn-edit-add-gallery"
                  >
                    <ImageIcon size={13} />
                    <span className="text-[9px] font-bold">Gallery</span>
                  </button>
                </div>
              )}
            </div>

            {/* Hidden Native File Inputs */}
            <input
              ref={nativeCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageFilesChange}
              className="hidden"
              id="native-camera-input-edit"
            />
            <input
              ref={nativeGalleryInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageFilesChange}
              className="hidden"
              id="native-gallery-input-edit"
            />

            {/* Direct Image URL Toggle */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="text-[11px] font-bold text-[#2563EB] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <UploadCloud size={13} />
                <span>{showUrlInput ? "Hide Link Option" : "Or add photo using a web link"}</span>
              </button>
            </div>

            {showUrlInput && (
              <div className="flex gap-2 pt-1 animate-in fade-in duration-150">
                <input
                  type="url"
                  placeholder="https://example.com/part-photo.jpg"
                  value={directImageUrlInput}
                  onChange={(e) => setDirectImageUrlInput(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddDirectUrl}
                  disabled={!directImageUrlInput.trim()}
                  className="px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Core Item Information */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-[#2563EB]" />
              <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Item Information
              </h2>
            </div>

            {/* Ad Title */}
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                Ad Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Maruti Swift Dzire OEM Front Bumper (2018-2022)"
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                id="edit-part-title-input"
              />
            </div>

            {/* Price (INR ₹) */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Selling Price (₹ INR) *
                </label>
                {price && (
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    ₹ {formatIndianCurrency(price)}
                  </span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">
                  ₹
                </span>
                <input
                  type="text"
                  value={price}
                  onChange={handlePriceChange}
                  placeholder="e.g. 4500"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-8 pr-4 text-sm font-black text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  id="edit-part-price-input"
                />
              </div>
            </div>

            {/* Condition Chips */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                Condition *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(["Brand New", "Like New", "Used (Good)", "For Scrap/Spares"] as const).map((cond) => (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setCondition(cond)}
                    className={`py-2 px-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer truncate ${
                      condition === cond
                        ? "bg-[#2563EB] border-[#2563EB] text-white shadow-xs"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cond}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Description *
                </label>
                <span className="text-[10px] text-slate-400">
                  {description.length} chars
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mention condition details, warranty, reason for sale, original part number, etc."
                rows={4}
                required
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                id="edit-part-description-input"
              />
            </div>
          </div>

          {/* Section 3: Vehicle Compatibility */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2">
              <Car size={18} className="text-[#2563EB]" />
              <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Vehicle Compatibility
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Brand */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Car Brand *
                </label>
                <select
                  value={carBrand}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  id="edit-part-brand-select"
                >
                  <option value="">-- Select Brand --</option>
                  {brandOptions.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Car Model *
                </label>
                <select
                  value={carModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  disabled={!carBrand}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 disabled:opacity-50 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  id="edit-part-model-select"
                >
                  <option value="">-- Select Model --</option>
                  {modelOptions.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Variant */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Car Variant (Optional)
                </label>
                <select
                  value={carVariant}
                  onChange={(e) => setCarVariant(e.target.value)}
                  disabled={!carModel}
                  className="w-full bg-slate-50 dark:bg-slate-800 disabled:opacity-50 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  id="edit-part-variant-select"
                >
                  <option value="">All Variants / Specific</option>
                  {variantOptions.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Category & Specific Part */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2">
              <Layers size={18} className="text-[#2563EB]" />
              <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Category & Sub-part
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Category */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Part Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  id="edit-part-category-select"
                >
                  <option value="">-- Select Category --</option>
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Specific Part Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Specific Spare Part *
                </label>
                <select
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                  disabled={!category}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 disabled:opacity-50 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  id="edit-part-name-select"
                >
                  <option value="">-- Select Specific Part --</option>
                  {partNameOptions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Location Details */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-[#2563EB]" />
                <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Location & Map
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowMapModal(true)}
                className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 text-[#2563EB] dark:text-blue-400 text-xs font-bold rounded-xl border border-blue-200 dark:border-blue-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                id="edit-part-pin-map-btn"
              >
                <Compass size={13} />
                <span>Pin Location on Map</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* State */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  State *
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedDistrict("");
                  }}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  id="edit-part-state-select"
                >
                  <option value="">-- Select State --</option>
                  {stateOptions.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  District *
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={!selectedState}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 disabled:opacity-50 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  id="edit-part-district-select"
                >
                  <option value="">-- Select District --</option>
                  {districtOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Area / Landmark */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Area / Locality
                </label>
                <input
                  type="text"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  placeholder="e.g. T. Nagar / Near Bus Stand"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="edit-part-area-input"
                />
              </div>
            </div>

            {/* Live Map Preview if coordinates present */}
            {lat !== undefined && lng !== undefined && (
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xs mt-2">
                <GMap
                  lat={lat}
                  lng={lng}
                  state={selectedState}
                  district={selectedDistrict}
                  height="160px"
                  interactive={false}
                />
              </div>
            )}
          </div>

          {/* Section 6: Contact Details */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2">
              <UserIcon size={18} className="text-[#2563EB]" />
              <h2 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Seller Contact Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Contact Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Contact / Seller Name *
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Your Name or Shop Name"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  id="edit-part-contact-name"
                />
              </div>

              {/* Contact Phone */}
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  Phone Number (10 Digits) *
                </label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2.5 pl-9 pr-4 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    id="edit-part-contact-phone"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* In-Form Primary Save Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div className="text-center sm:text-left space-y-1">
              <h3 className="text-xs font-black text-blue-950 dark:text-blue-200 uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1.5">
                <Check size={16} className="text-[#2563EB]" />
                <span>Ready to Update Ad?</span>
              </h3>
              <p className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">
                Tap Save to update your ad.
              </p>
            </div>
            <button
              type="submit"
              disabled={isSaving || isUploading || isDeleting}
              className="w-full sm:w-auto min-w-[200px] px-6 py-3.5 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white font-black text-xs rounded-xl uppercase tracking-wider shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              id="edit-part-in-form-save-btn"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check size={16} strokeWidth={3} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isSaving || isUploading || isDeleting}
            className="p-3 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800/60 font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Delete this Ad"
            id="edit-screen-delete-btn"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">Delete Ad</span>
          </button>

          <div className="flex items-center gap-2.5 flex-1 justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isUploading || isDeleting}
              className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl uppercase tracking-wider transition-colors cursor-pointer disabled:opacity-50"
              id="edit-screen-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={isSaving || isUploading || isDeleting}
              className="flex-1 sm:flex-none sm:min-w-[200px] px-6 py-3 bg-[#2563EB] hover:bg-blue-700 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl uppercase tracking-wider shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              id="edit-screen-save-btn"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check size={16} strokeWidth={3} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150" id="delete-confirmation-modal">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-xs">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Delete Listing?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Are you sure you want to permanently delete <span className="font-bold text-slate-700 dark:text-slate-200">"{title || part.title}"</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmPermanentDelete}
                disabled={isDeleting}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-extrabold text-white shadow-md transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Location Picker Modal */}
      {showMapModal && (
        <MapLocationModal
          initialLat={lat}
          initialLng={lng}
          state={selectedState}
          district={selectedDistrict}
          onConfirm={async (selectedLat, selectedLng) => {
            setLat(selectedLat);
            setLng(selectedLng);
            try {
              const geocoded = await reverseGeocodeLatLng(selectedLat, selectedLng, INDIAN_STATES_AND_DISTRICTS);
              if (geocoded.state && !selectedState) setSelectedState(geocoded.state);
              if (geocoded.district && !selectedDistrict) setSelectedDistrict(geocoded.district);
              if (geocoded.area && !selectedArea) setSelectedArea(geocoded.area);
            } catch (e) {
              // ignore
            }
          }}
          onClose={() => setShowMapModal(false)}
        />
      )}

      {/* Image Source Action Sheet (Camera vs Gallery) */}
      <ImageSourceActionModal
        isOpen={showImageSourceModal}
        onClose={() => setShowImageSourceModal(false)}
        onSelectCamera={() => setShowCameraModal(true)}
        onSelectFiles={handleFilesSelectFromModal}
        title="Add Listing Photos"
        subtitle="Take photo using camera or choose from gallery"
        multiple={true}
      />

      {/* Live Interactive Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCapture={handleCameraCapture}
        title="Photograph Spare Part"
        facingModePreference="environment"
      />
    </div>
  );
}
