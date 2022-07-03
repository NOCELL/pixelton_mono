import { UsersCollection } from "../models";
import { PixelsCollection, Pixel } from "../models/pixels";
import { BasicApiResponse } from "./types";

interface ApiPixel {
  x: number;
  y: number;
  color: string;
}

export interface LoadCanvasResponse extends BasicApiResponse {
  data: {
    items: ApiPixel[];
    balance: number;
    spent_balance: number;
  };
}

const load_canvas = async (
  request: any,
  reply: any
): Promise<LoadCanvasResponse> => {
  const { body } = request;
  const { telegram_id } = body;

  let userResponse = null;

  if (typeof telegram_id === "string") {
    const user = await UsersCollection.findOne({ telegram_id });

    if (user !== null) {
      userResponse = {
        balance: user.real_balance,
        spent_balance: user.spent_coins,
      };
    }
  }

  const canvasItemsFromDB = await PixelsCollection.find({});

  const pixelItems: ApiPixel[] = canvasItemsFromDB.map((canvasItem) => ({
    x: canvasItem.x,
    y: canvasItem.y,
    color: canvasItem.color,
  }));

  return {
    success: true,
    data: {
      items: pixelItems,
      ...userResponse,
    },
  };
};

export { load_canvas };
