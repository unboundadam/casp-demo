import fs from 'fs';
import path from 'path';

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

var api = axios.create();

(
  async function() {
    var res = await api.get("https://repo.dyadicsec.com/casp/UB2004/latest/client/centos/7.5/");
    var matching_files = res.data.match(/href=\"casp-sdk-package\S+.tar.gz\"/ig);
    if(matching_files.length != 1) throw new Error(`found ${matching_files.length} casp-sdk files`);

  }
)();
