import { useState } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";

export default function Uploader({
    handlePhotoChange,
    handlePhotoRemove,
}: {
    handlePhotoChange: (file: File) => void;
    handlePhotoRemove?: () => void;
}) {
    const [preview, setPreview] = useState<File | null>(null);
    const isGif = preview?.type === "image/gif" || preview?.name.toLowerCase().endsWith(".gif");

    const onDrop = async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        setPreview(file);
        handlePhotoChange(file);
    };

    const { getRootProps, getInputProps } = useDropzone({
        accept: {
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
            "image/webp": [".webp"],
        },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024,
        multiple: false,
        onDrop,
        onError: (error) => console.log(error),
    });

    return (
        <div className="dropzone">
            <div {...getRootProps()}>
                <input {...getInputProps()} />
                <p>Drag and drop an image file here, or click to select one</p>
            </div>
            {preview && (
                <div className="x-image-card">
                    <div className="x-image-card-header">
                        <div className="x-image-icon">🖼️</div>
                        <div>
                            <p className="x-image-title">{preview.name}</p>
                            <p className="x-image-subtitle">Image attached</p>
                        </div>
                        <button
                            type="button"
                            className="x-image-remove"
                            onClick={() => {
                                setPreview(null);
                                handlePhotoRemove?.();
                            }}
                        >
                            Remove
                        </button>
                    </div>
                    {isGif ? (
                        <img className="preview x-image-preview" src={URL.createObjectURL(preview)} alt="preview" />
                    ) : (
                        <Image className="preview x-image-preview" src={URL.createObjectURL(preview)} width={250} height={250} alt="preview" />
                    )}
                </div>
            )}
            <style jsx>{`
                .x-image-card {
                    margin-top: 10px;
                    padding: 14px;
                    border: 1px solid rgba(15, 20, 25, 0.12);
                    border-radius: 16px;
                    background: var(--twitter-white);
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .x-image-card-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .x-image-icon {
                    width: 42px;
                    height: 42px;
                    border-radius: 14px;
                    display: grid;
                    place-items: center;
                    background: rgba(29, 155, 240, 0.1);
                    font-size: 20px;
                }
                .x-image-title {
                    margin: 0;
                    font-weight: 700;
                    color: var(--twitter-black);
                    word-break: break-all;
                }
                .x-image-subtitle {
                    margin: 2px 0 0;
                    color: var(--twitter-muted);
                    font-size: 13px;
                }
                .x-image-remove {
                    margin-left: auto;
                    border: none;
                    background: transparent;
                    color: rgb(29, 155, 240);
                    font-weight: 700;
                    cursor: pointer;
                }
                .x-image-preview {
                    width: 100%;
                    max-height: 320px;
                    object-fit: cover;
                    border-radius: 12px;
                }
            `}</style>
        </div>
    );
}
