"use client";

import { PaletteIcon, PenBoxIcon, PinIcon, TagsIcon } from "lucide-react";

const NoNotesPlaceholder = () => {
  return (
    <div className="flex items-center justify-center min-h-[70vh] sm:py-20">
      <div className="text-center max-w-xl px-6">
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full blur-2xl opacity-50"></div>
          </div>
          <div className="relative text-[var(--text-tertiary)] transition-all flex items-center justify-center rounded-lg mb-2">
            <PenBoxIcon className="size-24" />
          </div>
        </div>
        <h3 className="text-3xl font-bold text-[var(--text-tertiary)] mb-4">No Notes Yet</h3>
        <p className="text-lg text-[var(--text-tertiary)] mb-8 leading-relaxed">
          Your notebook is empty. Start capturing your thoughts, ideas, and important information by
          creating your first note!
        </p>
        <div className="flex flex-col gap-3 text-sm text-[var(--text-tertiary)]">
          <div className="flex items-center gap-2 justify-center">
            <TagsIcon className="size-6 -rotate-135" />
            <span className="mr-3">Organize with labels</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <PaletteIcon className="size-6" />
            <span>Customize with colors</span>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <PinIcon className="size-6" />
            <span className="mr-3">Pin important notes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoNotesPlaceholder;
