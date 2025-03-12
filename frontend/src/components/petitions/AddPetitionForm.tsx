import { useState, useRef } from "react";
import { useSelector } from "react-redux";
import { extractTextFromImage } from "../../services/ocr";
import { getFromDeepseek } from "../../services/deepSeek";
import { petitions } from "../../services/api";
import type { RootState } from "../../store";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../config/fireBaseConfig";
import { v4 as uuidv4 } from "uuid";

interface AddPetitionFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const AddPetitionForm = ({ onSuccess, onCancel }: AddPetitionFormProps) => {
  const { token } = useSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [extractingText, setExtractingText] = useState(false);
  const [progress, setProgress] = useState<number>(0); // Track upload progress
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUpload, setImageUpload] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium" as "low" | "medium" | "high",
    imageUrl: "",
  });

  /** Handles form input changes */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /** Uploads the image to Firebase Storage and tracks progress */
  const uploadFile = async (file: File): Promise<string | null> => {
    if (!file) return null;
    try {
      setProgress(0);
      const imageRef = ref(storage, `images/${file.name}-${uuidv4()}`);
      const uploadTask = uploadBytesResumable(imageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setProgress(percent);
          },
          (error) => {
            setError("Failed to upload image. Please try again.");
            setProgress(0);
            reject(null);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            setProgress(100);
            resolve(downloadURL);
          }
        );
      });
    } catch (err) {
      setError("Failed to upload image. Please try again.");
      return null;
    }
  };

  /** Handles image selection, preview, and uploads the image */
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    setImageUpload(file);

    // Generate image preview
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    setExtractingText(true);
    setProgress(0);

    try {
      // Upload Image to Firebase Storage
      const uploadedImageUrl = await uploadFile(file);
      if (uploadedImageUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: uploadedImageUrl }));

        const extractedText = await extractTextFromImage(uploadedImageUrl);
        if (extractedText) {
          const formattedData = await getFromDeepseek(extractedText);
          if (formattedData) {
            setFormData((prev) => ({
              ...prev,
              title: formattedData.title || prev.title,
              description: formattedData.content || prev.description,
              category: formattedData.category || prev.category,
            }));
          }
        }
      }
    } catch (error) {
      setError("Error processing the image.");
    } finally {
      setExtractingText(false);
      setProgress(0);
    }
  };

  /** Handles form submission */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await petitions.create(formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create petition");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-50 text-red-600 p-3 rounded">{error}</div>}

      {/* Image Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Image (Optional)</label>
        <div className="mt-1 flex items-center space-x-4">
          <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" />
          {extractingText && <span className="text-sm text-gray-500">Processing image...</span>}
          {imagePreview && (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded" />
              <button type="button" className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1" onClick={() => setImagePreview(null)}>
                ✖
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="w-full bg-gray-200 rounded mt-2">
            <div
              className="bg-blue-500 text-xs font-medium text-white text-center p-1 leading-none rounded"
              style={{ width: `${progress}%` }}
            >
              {progress}%
            </div>
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input type="text" name="title" className="input-field w-full border  border-gray-300 " value={formData.title} onChange={handleInputChange} required />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm w-full font-medium text-gray-700">Description</label>
        <textarea name="description" value={formData.description} onChange={handleInputChange} required rows={4} className="input-field w-full border  border-gray-300" />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <input type="text" name="category" value={formData.category} onChange={handleInputChange} required className="input-field w-full border  border-gray-300" />
      </div>

      {/* Submit and Cancel Buttons */}
      <div className="flex justify-between">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Submitting..." : "Submit"}
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default AddPetitionForm;
