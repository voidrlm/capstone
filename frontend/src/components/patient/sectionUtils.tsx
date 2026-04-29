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
        variant="outlined"
        startIcon={<Edit2 size={13} />}
        onClick={() => { ensureEditable(); onEdit(); }}
        sx={{
          borderRadius: 999,
          borderColor: "rgba(0,212,170,0.35)",
          color: "#00d4aa",
          fontWeight: 600,
          "&:hover": { borderColor: "#00d4aa", bgcolor: "rgba(0,212,170,0.06)" },
        }}
      >
        {isEditing ? "Editing" : "Edit"}
      </Button>
      <Button
        size="small"
        variant="outlined"
        startIcon={<Trash2 size={13} />}
        onClick={() => { ensureEditable(); onDelete(); }}
        sx={{
          borderRadius: 999,
          borderColor: "rgba(239,68,68,0.35)",
          color: "#ef4444",
          fontWeight: 600,
          "&:hover": { borderColor: "#ef4444", bgcolor: "rgba(239,68,68,0.06)" },
        }}
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
