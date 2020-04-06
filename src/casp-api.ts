import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";
import * as https from 'https';
import queryString = require('query-string');

interface NewTokenResponse {
  "access_token": string,
  "token_type": string,
  "expires_in": number,
  "scope": string
}

export class Api {
    private api: AxiosInstance;
    private bearerToken: string;

    public constructor (config: AxiosRequestConfig) {
        this.api = axios.create(config);
        this.api.defaults.headers.post['Content-Type'] = `application/json`;

        this.api.interceptors.request.use((config: AxiosRequestConfig) => {
          var newConfig = { ...config };
          if(this.bearerToken) {
            var headers = newConfig.headers || {};
            var common = headers.common || {};
            common['Authorization'] = `Bearer ${this.bearerToken}`;
            newConfig.headers = headers;
            // console.log(headers);
          }

          return newConfig;
        });
    }

    public setBearerToken(token: string) {
      this.bearerToken = token;
      console.log(token);
    }

    public getUri (config?: AxiosRequestConfig): string {
        return this.api.getUri(config);
    }

    public request<T, R = AxiosResponse<T>> (config: AxiosRequestConfig): Promise<R> {
        return this.api.request(config);
    }

    public get<T, R = AxiosResponse<T>> (url: string, config?: AxiosRequestConfig): Promise<R> {
        return this.api.get(url, config);
    }

    public delete<T, R = AxiosResponse<T>> (url: string, config?: AxiosRequestConfig): Promise<R> {
        return this.api.delete(url, config);
    }

    public head<T, R = AxiosResponse<T>> (url: string, config?: AxiosRequestConfig): Promise<R> {
        return this.api.head(url, config);
    }

    public post<T, R = AxiosResponse<T>> (url: string, data?: any, config?: AxiosRequestConfig): Promise<R> {
        return this.api.post(url, data, config);
    }

    public put<T, R = AxiosResponse<T>> (url: string, data?: string, config?: AxiosRequestConfig): Promise<R> {
        return this.api.put(url, data, config);
    }

    public patch<T, R = AxiosResponse<T>> (url: string, data?: string, config?: AxiosRequestConfig): Promise<R> {
        return this.api.patch(url, data, config);
    }
}

export interface LoginCredentials {
  user: string;
  password: string;
}

export interface CaspAccount {
  id: string,
  name: string,
  isGlobal: boolean
}

export interface CaspParticipant {
  id: string,
  activationCode?: string,
  name: string,
  serverAuthenticationKey?: string,
  serverEncryptionKey?: string,
  deviceType?: string,
  offline?: boolean,
  role: string
}

export class CaspApi extends Api {
  accounts: CaspAccount[];
  activeAccount: CaspAccount;
  constructor (
    readonly config: any) {
    super({
      baseURL: config.caspServerUrl,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });
  }

  async init(credentials?: LoginCredentials): Promise<any> {
    credentials = credentials || this.config;
    var response =  await this.get<any>(`/mng/status`, {
            params: {
              withDetails: true
            }
          });
    const  status = response.data;
    console.log(status);

    var token = await this.newApiToken(credentials);
    console.log(token);

//   try {
//   var key = await this.newApiKey({user: "so", password: "Unbound1!"});
//   console.log(key);
// } catch(e) {
//   console.log(e);
// }
    this.accounts = await this.listAccounts();
    this.activeAccount = this.accounts[0];

  // response =  await this.get<any>(`/mng/trusted/me`);
  // const trusted = response.data;
    return { status};

            // .catch((error: AxiosError) => {
            //     throw error;
            // });

    }

  // Login and tokens

  public async newApiToken(credentials: LoginCredentials): Promise<any> {
    var loginData = {
      grant_type: "password",
      scope: "/mng",
      username: credentials.user,
      password: credentials.password,
      client_id: "so"
    }
    console.log(queryString.stringify(loginData))
    var response =  await this.post<any>(`/mng/auth/tokens`,
      queryString.stringify(loginData),
     {
       headers: {'Content-Type': 'application/x-www-form-urlencoded' }
     })
    this.setBearerToken(response.data.access_token);
    return response.data;
  }

  public async newApiKey(credentials: LoginCredentials): Promise<NewTokenResponse> {
    var response =  await this.post<NewTokenResponse>(`/mng/auth/apikeys`,
      JSON.stringify({
        "grant_type":"client_credentials",
        "scope":"/mng",
        "password": credentials.password,
        "client_id":"client13",
        "client_role": "SUPER_USER"
      }))
    return response.data;
  }

  // accounts

  get activeAccountBase(): string {
    return `/mng/accounts/${this.activeAccount.id}`
  }

  async listAccounts(): Promise<CaspAccount[]> {
    return (await this.get<CaspAccount[]>('/mng/accounts')).data;
  }

  async createAccount(name: string, isGlobal = false): Promise<CaspAccount> {
    return (await this.post<CaspAccount>('/mng/accounts',
     { name, isGlobal})).data;
  }

  async getAccount(id: string): Promise<CaspAccount> {
    return (await this.get<CaspAccount>('/mng/accounts/' + id)).data;
  }

  async findOrCreateAccount(name?: string, id?: string): Promise<CaspAccount> {
    var account: CaspAccount;
    if(id) {
      account = await this.getAccount(id);
      if(account) return account;
    }
    if(!name) return;
    var accounts = await this.listAccounts();
    account = accounts.find(a => a.name.toUpperCase() === name.toUpperCase());
    if(!account) {
      account = await this.createAccount(name);
    }
    return account;
  }

  // participants

  async getParticipant(idOrName: string, accountId?: string): Promise<CaspParticipant> {
    var participant: CaspParticipant;
    try {
      participant = (await this.get<CaspParticipant>(`/mng/participants/${idOrName}`)).data;
    } catch(e) {
      if(e.response.status != 404) throw e;
    }
    if(participant) return participant;
    accountId = accountId || this.activeAccount && this.activeAccount.id;
    var participants = (await this.get<CaspParticipant[]>(`/mng/accounts/${accountId}/participants`,
      {
        params: {
          filter: idOrName
        }
      }
    )).data;
    console.log(participants);
    if(participants.length > 1) throw new Error(
      'More than one participant found'
    )
    return participants[0];
  }

  async createParticipant(name: string, offline: boolean = false, email?: string): Promise<CaspParticipant> {
      email = email || `${name.replace(" ","_")}@someemail.com`;
    return (await this.post<CaspParticipant>(
      `${this.activeAccountBase}/participants`,
      {
        name,
        offline,
        role: "Participant",
        email
      }
    ))
    .data;
  }

  async findOrCreateParticipant(id?: string, name?: string, offline = false): Promise<CaspParticipant> {
    var participant: CaspParticipant;
    if(id) {
      participant = await this.getParticipant(id);
      if(participant) return participant;
    }
    if(!name) return;
    participant = await this.getParticipant(name);
    if(participant) return participant;
    var newPart = await this.createParticipant(name, offline);
    return {
      ...newPart,
      ...(await this.getParticipant(newPart.id))
    };
  }

  async activateOfflineParticipant(participantID: string, activationData: any): Promise<CaspParticipant> {
    return (await this.post<CaspParticipant>(`/mng/participants/${participantID}/activateOffline`,
      activationData)).data;
  }


}
