import React, { useState, useEffect } from "react";
import Dialog from "@notes/ui/dialog/dialog";
import Button from "@notes/ui/button";
import type { Label } from "@notes/types/label-types";
import { apiClient } from "@notes/utils/api";
import { Plus, Edit, Trash2 } from "lucide-react";
import { cn } from "@notes/utils/css-utils";
import LoadingIndicator from "@notes/ui/loading-indicator";

interface LabelsManagementDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface LabelFormData {
  name: string;
  color: string;
}

const LabelsManagementDialog: React.FC<LabelsManagementDialogProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<LabelFormData>({ name: "", color: "#2196F3" });
  const [error, setError] = useState<string | null>(null);

  const fetchLabels = async () => {
    try {
      setLoading(true);
      const response = await apiClient.labels.fetchLabels();
      setLabels(response.labels);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch labels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLabels();
    }
  }, [isOpen]);

  const handleCreateLabel = async () => {
    if (!formData.name.trim()) {
      setError("Label name is required");
      return;
    }

    try {
      const newLabel = await apiClient.labels.createLabel({
        name: formData.name.trim(),
        color: formData.color,
      });
      setLabels([...labels, newLabel]);
      setFormData({ name: "", color: "#2196F3" });
      setShowCreateForm(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create label");
    }
  };

  const handleUpdateLabel = async () => {
    if (!editingLabel || !formData.name.trim()) {
      setError("Label name is required");
      return;
    }

    try {
      const updatedLabel = await apiClient.labels.updateLabel(editingLabel.id, {
        name: formData.name.trim(),
        color: formData.color,
      });
      setLabels(labels.map(label => (label.id === editingLabel.id ? updatedLabel : label)));
      setEditingLabel(null);
      setFormData({ name: "", color: "#2196F3" });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update label");
    }
  };

  const handleDeleteLabel = async (labelId: number) => {
    if (!confirm("Are you sure you want to delete this label? This action cannot be undone.")) {
      return;
    }

    try {
      await apiClient.labels.deleteLabel(labelId);
      setLabels(labels.filter(label => label.id !== labelId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete label");
    }
  };

  const startEdit = (label: Label) => {
    setEditingLabel(label);
    setFormData({ name: label.name, color: label.color });
    setShowCreateForm(false);
    setError(null);
  };

  const startCreate = () => {
    setShowCreateForm(true);
    setEditingLabel(null);
    setFormData({ name: "", color: "#2196F3" });
    setError(null);
  };

  const cancelForm = () => {
    setShowCreateForm(false);
    setEditingLabel(null);
    setFormData({ name: "", color: "#2196F3" });
    setError(null);
  };

  const predefinedColors = [
    "#2196F3",
    "#4CAF50",
    "#FF9800",
    "#F44336",
    "#9C27B0",
    "#00BCD4",
    "#8BC34A",
    "#FFC107",
    "#E91E63",
    "#673AB7",
  ];

  return (
    <Dialog isOpen={isOpen} onOpenChange={onOpenChange} mobileVariant="fullscreen">
      <Dialog.Content className="w-full max-w-2xl h-fit max-h-[80vh]">
        <Dialog.Content.Header>
          <h2 className="text-xl font-semibold text-gray-900">Manage Labels</h2>
        </Dialog.Content.Header>

        <div className="px-6 py-4 flex-1 overflow-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Create/Edit Form */}
          {(showCreateForm || editingLabel) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
              <h3 className="text-lg font-medium mb-3">
                {editingLabel ? "Edit Label" : "Create New Label"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter label name"
                    maxLength={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                      className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                      className="px-3 py-1 border border-gray-300 rounded text-sm font-mono"
                      placeholder="#2196F3"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={cn(
                          "w-6 h-6 rounded border-2 cursor-pointer",
                          formData.color === color ? "border-gray-600" : "border-gray-300"
                        )}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    text={editingLabel ? "Update" : "Create"}
                    onClick={editingLabel ? handleUpdateLabel : handleCreateLabel}
                    variant="apply"
                  />
                  <Button text="Cancel" onClick={cancelForm} variant="secondary" />
                </div>
              </div>
            </div>
          )}

          {/* Labels List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Your Labels</h3>
              {!showCreateForm && !editingLabel && (
                <Button
                  icon={Plus}
                  text="Add Label"
                  onClick={startCreate}
                  variant="main"
                  iconSize="4"
                />
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingIndicator className="h-6 w-6" />
              </div>
            ) : labels.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No labels created yet.</p>
                <p className="text-sm">Create your first label to get started!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {labels.map(label => (
                  <div
                    key={label.id}
                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: label.color }} />
                      <div>
                        <span className="font-medium">{label.name}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({label.notes_count} note{label.notes_count !== 1 ? "s" : ""})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        icon={Edit}
                        onClick={() => startEdit(label)}
                        variant="plain"
                        iconSize="4"
                        title="Edit label"
                      />
                      <Button
                        icon={Trash2}
                        onClick={() => handleDeleteLabel(label.id)}
                        variant="plain"
                        iconSize="4"
                        title="Delete label"
                        className="text-red-600 hover:text-red-700"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Dialog.Content.Footer>
          <div className="flex justify-end">
            <Button text="Close" onClick={() => onOpenChange(false)} variant="secondary" />
          </div>
        </Dialog.Content.Footer>
      </Dialog.Content>
    </Dialog>
  );
};

export default LabelsManagementDialog;
