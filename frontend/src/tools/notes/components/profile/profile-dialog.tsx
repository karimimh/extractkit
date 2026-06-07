import type { UserImagesResponse } from "@notes/types/image-types";
import type { UserStatistics } from "@notes/types/statistics-types";
import Dialog from "@notes/ui/dialog/dialog";
import { getBackendBaseUrl } from "@notes/utils/api/client";
import { apiClient } from "@notes/utils/api/index";
import {
  ChevronDown,
  ChevronRight,
  Database,
  Eye,
  EyeOff,
  FileText,
  HardDrive,
  Images,
  Lock,
  RefreshCw,
  Tag,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";

interface ProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileDialog: React.FC<ProfileDialogProps> = ({ isOpen, onOpenChange }) => {
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [profile, setProfile] = useState<{ email: string; username: string } | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UserImagesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadedImages, setShowUploadedImages] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, userProfile, userImages] = await Promise.all([
        apiClient.getUserStatistics(),
        apiClient.getUserProfile(),
        apiClient.images.getUserImages(),
      ]);
      setStatistics(stats);
      setProfile(userProfile);
      setUploadedImages(userImages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
      setPasswordSuccess(null);
    }
  }, [isOpen]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return;
    }

    setPasswordLoading(true);
    try {
      const response = await apiClient.changePassword(currentPassword, newPassword);
      setPasswordSuccess(response.message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordSuccess(null);
      }, 2000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const resolveImageUrl = (url: string): string => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return `${getBackendBaseUrl()}${url}`;
  };

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} mobileVariant="fullscreen">
      <Dialog.Content className="max-w-lg sm:h-[unset] sm:max-h-[80vh] relative">
        <Dialog.Content.Header className="shadow-sm font-bold z-20 text-[var(--text-primary)]">
          Profile
        </Dialog.Content.Header>
        <div className="mt-2 mb-2 mx-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              <span className="ml-2 text-[var(--text-secondary)]">Loading...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && profile && statistics && (
            <>
              {/* Profile Info */}
              <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--border-primary)] mb-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <User className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      Account Information
                    </h3>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-[var(--text-secondary)]">Email</label>
                    <p className="text-base text-[var(--text-primary)] font-medium">
                      {profile.email}
                    </p>
                  </div>
                </div>

                {/* Change Password Section */}
                <div className="mt-4 pt-4 border-t border-[var(--border-primary)]">
                  {!showPasswordForm ? (
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"
                    >
                      <Lock className="w-4 h-4" />
                      Change Password
                    </button>
                  ) : (
                    <form onSubmit={handleChangePassword} className="space-y-3">
                      <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                        Change Password
                      </h4>

                      <div>
                        <label className="text-sm text-[var(--text-secondary)] block mb-1">
                          Current Password
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            className="w-full px-3 py-2 pr-10 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm text-[var(--text-secondary)] block mb-1">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 pr-10 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          >
                            {showNewPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm text-[var(--text-secondary)] block mb-1">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 pr-10 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {passwordError && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                          <p className="text-red-500 text-sm">{passwordError}</p>
                        </div>
                      )}

                      {passwordSuccess && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                          <p className="text-green-500 text-sm">{passwordSuccess}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={passwordLoading}
                          className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          {passwordLoading ? "Updating..." : "Update Password"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setCurrentPassword("");
                            setNewPassword("");
                            setConfirmPassword("");
                            setPasswordError(null);
                            setPasswordSuccess(null);
                          }}
                          className="px-4 py-2 bg-[var(--bg-primary)] hover:bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg transition-colors border border-[var(--border-primary)]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>

              {/* Storage Usage */}
              <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--border-primary)] mb-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <HardDrive className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      Storage Used
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Total storage consumption
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-3xl font-bold text-[var(--text-primary)]">
                      {statistics.storage_used_mb.toFixed(2)} MB
                    </span>
                    <span className="text-sm text-[var(--text-secondary)]">
                      ({formatBytes(statistics.storage_used_bytes)})
                    </span>
                  </div>
                  <div className="w-full bg-[var(--bg-primary)] rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((statistics.storage_used_mb / 20) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {uploadedImages && (
                <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--border-primary)] mb-2">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <button
                      type="button"
                      onClick={() => setShowUploadedImages(prev => !prev)}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Images className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                          Uploaded Images
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {uploadedImages.total_images} images -{" "}
                          {formatBytes(uploadedImages.total_size_bytes)}
                        </p>
                      </div>
                      {showUploadedImages ? (
                        <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[var(--text-secondary)]" />
                      )}
                    </button>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {uploadedImages.total_images === 0
                        ? "No uploads yet"
                        : `${uploadedImages.total_images} total`}
                    </div>
                  </div>

                  {showUploadedImages && (
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {uploadedImages.images.length === 0 ? (
                        <p className="text-sm text-[var(--text-secondary)]">
                          You haven't uploaded any images yet.
                        </p>
                      ) : (
                        uploadedImages.images.map(image => (
                          <div
                            key={image.id}
                            className="flex items-center gap-3 p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-primary)] shadow-sm"
                          >
                            <img
                              src={resolveImageUrl(image.image)}
                              alt={image.note_title || "Note image"}
                              className="w-14 h-14 object-cover rounded-md border border-[var(--border-primary)]"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                                {image.note_title || "Untitled note"}
                              </p>
                              <p className="text-xs text-[var(--text-secondary)]">
                                Note #{image.note_id}
                              </p>
                              <div className="text-xs text-[var(--text-secondary)]">
                                {formatBytes(image.size_bytes)} - {formatDate(image.uploaded_at)}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Resource Counts */}
              <div className="grid grid-cols-2 gap-4 mb-2">
                {/* Notes Count */}
                <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--border-primary)]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <FileText className="w-4 h-4 text-green-500" />
                    </div>
                    <h4 className="text-sm font-medium text-[var(--text-secondary)]">Notes</h4>
                  </div>
                  <p className="text-3xl font-bold text-[var(--text-primary)]">
                    {statistics.note_count}
                  </p>
                </div>

                {/* Labels Count */}
                <div className="bg-[var(--bg-secondary)] rounded-lg p-6 border border-[var(--border-primary)]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Tag className="w-4 h-4 text-purple-500" />
                    </div>
                    <h4 className="text-sm font-medium text-[var(--text-secondary)]">Labels</h4>
                  </div>
                  <p className="text-3xl font-bold text-[var(--text-primary)]">
                    {statistics.label_count}
                  </p>
                </div>
              </div>

              {/* Last Updated */}
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] pt-4 border-t border-[var(--border-primary)] mb-2">
                <Database className="w-4 h-4" />
                <span>Last updated: {formatDate(statistics.updated_at)}</span>
              </div>

              {/* Refresh Button */}
              <button
                onClick={fetchData}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </button>
            </>
          )}
        </div>
      </Dialog.Content>
    </Dialog>
  );
};

export default ProfileDialog;
