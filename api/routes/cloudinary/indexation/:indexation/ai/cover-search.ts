import { Request, Response } from "express";
import { getIndexationResources } from "../index";
import axios from "axios";

import {
  call,
  addTokenRequestInterceptor,
  addUrlParamsRequestInterceptor,
} from "ducksmanager/src/util/axios";
import { POST__cover_id__search } from "ducksmanager/types/routes";
import Cookies from "js-cookie";

const defaultApi = addTokenRequestInterceptor(
  addUrlParamsRequestInterceptor(
    axios.create({ baseURL: process.env.VITE_DM_API_URL })
  ),
  () => Cookies.get("token") as string
);
export const get = async (req: Request, res: Response) => {
  const indexationResources = await getIndexationResources(
    req.params.indexation,
    req.user.username
  );
  const image = await axios.get(indexationResources[0].url, {
    responseType: "arraybuffer",
  });
  return res.json(
    (
      await call(
        defaultApi,
        new POST__cover_id__search({
          reqBody: { base64: Buffer.from(image.data).toString("base64") },
        })
      )
    ).data
  );
};
