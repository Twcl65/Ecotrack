type Props = {
  src: string | null;
  alt?: string;
  className?: string;
  emptyClassName?: string;
};

export default function ComplaintAttachmentImage({
  src,
  alt = "Complaint attachment",
  className = "h-24 w-24 rounded-lg border border-gray-200 object-cover",
  emptyClassName = "h-24 w-24 rounded-lg border border-dashed border-gray-300 bg-gray-100",
}: Props) {
  if (!src) {
    return (
      <div
        className={`flex items-center justify-center text-[10px] text-gray-400 ${emptyClassName}`}
      >
        No image
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  );
}
