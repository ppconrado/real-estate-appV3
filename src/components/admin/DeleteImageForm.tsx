"use client";

type DeleteImageFormProps = {
  imageId: number;
  action: (formData: FormData) => void;
};

export default function DeleteImageForm({ imageId, action }: DeleteImageFormProps) {
  return (
    <form
      action={action}
      onSubmit={event => {
        if (!confirm("Delete this image? This cannot be undone.")) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="imageId" value={imageId} />
      <button
        type="submit"
        className="rounded-lg border border-zinc-200 px-3 py-1 text-zinc-600"
      >
        Delete
      </button>
    </form>
  );
}
