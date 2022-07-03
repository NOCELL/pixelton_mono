import mongoose from "mongoose";

export interface Pixel {
  id: string,
  x: number;
  y: number;
  color: string;
}

const PixelSchema = new mongoose.Schema<Pixel>({
  id: { type: String, index: true, unique: true, required: true },
  x: { type: Number, index: false, required: true },
  y: { type: Number, index: false, required: true },
  color: { type: String, index: false, required: true },
});

const PixelsCollection = mongoose.model("canvas", PixelSchema);

export { PixelsCollection };
