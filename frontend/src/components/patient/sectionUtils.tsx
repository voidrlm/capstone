import { Box, Button } from "@mui/material";
import { Edit2, Trash2 } from "lucide-react";

export function ItemActions({
  onEdit,
  onDelete,
  isEditing,
  ensureEditable,
}: {
  onEdit: () => void;
  onDelete: () => void;
  isEditing: boolean;
  ensureEditable: () => void;
}) {
  return (
    <Box sx={{ display: "flex", gap: 1 }}>
      <Button
        size="small"
        variant={isEditing ? "contained" : "outlined"}
        startIcon={<Edit2 size={14} />}
        onClick={() => { ensureEditable(); onEdit(); }}
      >
        {isEditing ? "Editing" : "Edit"}
      </Button>
      <Button
        size="small"
        color="error"
        variant="outlined"
        startIcon={<Trash2 size={14} />}
        onClick={() => { ensureEditable(); onDelete(); }}
      >
        Delete
      </Button>
    </Box>
  );
}

export function makeSectionHelpers(
  editable: boolean,
  onStartEdit: (() => void) | undefined,
  onSave: (() => Promise<boolean>) | undefined,
  saving: boolean | undefined,
) {
  const ensureEditable = () => { if (!editable) onStartEdit?.(); };
  const handleDone = async (resetEditor: () => void) => {
    const didSave = await onSave?.();
    if (didSave !== false) resetEditor();
  };
  return { ensureEditable, handleDone, saving: saving ?? false };
}
