"use client";

import CreateNoteForm from "./create-note-form";

interface NoteFormMobileProps {
  onNoteCreated: () => void;
}

const NoteFormMobile = ({ onNoteCreated }: NoteFormMobileProps) => {
  return (
    // FAB for mobile devices
    <div className="sm:hidden">
      <CreateNoteForm onNoteCreated={onNoteCreated} />
    </div>
  );
};

export default NoteFormMobile;
