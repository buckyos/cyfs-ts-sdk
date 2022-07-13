import {DecAppId} from "../../cyfs-core";

export * from './objects';
export * from './type'

export const PERF_DEC_ID_STR = "9tGpLNnAAYE9Dd4ooNiSjtP5MeL9CNLf9Rxu6AFEc12M";
// 这里硬编码生成的DecId
export const DEC_ID = DecAppId.from_base_58(PERF_DEC_ID_STR).unwrap();