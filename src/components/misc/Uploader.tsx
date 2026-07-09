import { useState } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";

export default function Uploader({ handlePhotoChange }: { handlePhotoChange: (file: File) => void }) {
    const [preview, setPreview] = useState<File | null>(null);
    const isGif = preview?.type === "image/gif" || preview?.name.toLowerCase().endsWith(".gif");

    const onDrop = async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        setPreview(file);
        handlePhotoChange(file);
    };

    const { getRootProps, getInputProps } = useDropzone({
        accept: {
            "image/*": [".gif"],
            "image/gif": [".gif"],
        },
        maxFiles: 1,
        maxSize: 1024 * 1024,
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
                isGif ? (
                    <img className="preview" src={URL.createObjectURL(preview)} alt="preview" />
                ) : (
                    <Image className="preview" src={URL.createObjectURL(preview)} width={250} height={250} alt="preview" />
                )
            )}
        </div>
    );
}
