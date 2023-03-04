import { isNode } from "browser-or-node"
import { v4 as uuidv4 } from "uuid";
import { last } from "lodash"
import invariant from "invariant"
import nodeFetch from "node-fetch"
import { Configuration, StorageApi, Provider } from "@xopenapi/xapis-js";
import COS from "cos-js-sdk-v5";
import { SupportedFetch } from "../../fetch-types"
import { ImageMessagePayload, AudioMessagePayload, VideoMessagePayload, Message, MessagePayload, MessageType, Moment, ImageMomentContent, VideoMomentContent, MomentContent, MomentType } from "../../models"

const TOKEN_KEY = "uim-js:upload:token:"
const TOKEN_EXPIRY_KEY = "uim-js:upload:token_expiry:"

// 上传文件插件参数
export interface UploadOptions {
	// 为消息上传时指定消息
	message?: Message
	// 为动态上传时指定动态
	moment?: Moment
	// 上传进度回调
	onProgress?: (percent: number) => void
}

// 文件上传插件
export interface UploadPlugin {
	// 上传文件
	upload(file: File, options: UploadOptions): Promise<MessagePayload | MomentContent>
}

interface ImageInfo {
	width: number
	height: number
	size: number
	format: string
}

interface AudioInfo {
	size: number
	duration: number
	format: string
}

interface VideoInfo {
	width: number
	height: number
	size: number
	duration: number
	format: string
}

interface QCloudImageInfo {
	width: string
	height: string
	size: string
	format?: string
}

/**
 * 默认的上传插件
 */
export class UIMUploadPlugin {

	_uuid: string
	_token: string
	_tokenBasePath: string
	_fetch: SupportedFetch
	_client?: StorageApi

	constructor(uuid: string, token: string, tokenBasePath: string) {
		this._uuid = uuid
		this._token = token
		this._tokenBasePath = tokenBasePath
		this._fetch = isNode ? nodeFetch : window.fetch.bind(window)
	}

	async upload(file: File, options: UploadOptions): Promise<MessagePayload | MomentContent> {
		const { message, moment } = options
		invariant(message || moment, "must have message or moment")
		const ext = last(file.name.split("."))
		const path = `${uuidv4()}.${ext}`
		const url = await this.uploadFile(file, path, options.onProgress)

		if (message) {
			// 上传消息的文件
			switch (message.type) {
				case MessageType.Image: {
					const imageInfo = await this.getImageInfo(url)
					const thumbnail = await this.getImageThumbnail(url, 400, 400)
					return { url, ...imageInfo, thumbnail } as ImageMessagePayload
				}
				case MessageType.Audio: {
					const audioInfo = await this.getAudioInfo(path)
					return { url, ...audioInfo } as AudioMessagePayload
				}
				case MessageType.Video: {
					const videoInfo = await this.getVideoInfo(path)
					const snapshot = await this.getVideoSnapshot(path)
					return { url, ...videoInfo, snapshot } as VideoMessagePayload
				}
			}
		}

		if (moment) {
			switch (moment.type) {
				case MomentType.Image: {
					const imageInfo = await this.getImageInfo(url)
					const thumbnail = await this.getImageThumbnail(url, 400, 400)
					return { url, ...imageInfo, thumbnail } as ImageMomentContent
				}
				case MomentType.Video: {
					const videoInfo = await this.getVideoInfo(path)
					const snapshot = await this.getVideoSnapshot(path)
					return { url, ...videoInfo, snapshot } as VideoMomentContent
				}
			}
		}

		throw new Error("unsupported message type")
	}

	private async getVideoInfo(path: string): Promise<VideoInfo> {
		const client = await this.getClient()
		const result = await client.getVideoInfo({ path, provider: Provider.Qcloud })
		return {
			width: result.width,
			height: result.height,
			size: result.size,
			duration: result.duration,
			format: last(path.split("."))!
		}
	}

	private async getVideoSnapshot(path: string): Promise<string> {
		const client = await this.getClient()
		const result = await client.getVideoSnapshot({ path, provider: Provider.Qcloud })
		return result.url
	}

	private async getAudioInfo(path: string): Promise<AudioInfo> {
		const client = await this.getClient()
		const result = await client.getAudioInfo({ path, provider: Provider.Qcloud })
		return {
			size: result.size,
			duration: result.duration,
			format: last(path.split("."))!
		}
	}

	private async getImageInfo(url: string): Promise<ImageInfo> {
		const result = await this.httpGet<QCloudImageInfo>(`${url}?imageInfo`)
		return {
			width: parseInt(result.width, 10),
			height: parseInt(result.height, 10),
			size: parseInt(result.size, 10),
			format: result.format ?? ""
		}
	}

	private async getImageThumbnail(url: string, maxWidth: number, maxHeight: number): Promise<string> {
		return `${url}?imageMogr2/thumbnail/${maxWidth}x${maxHeight}>`
	}

	private async uploadFile(file: File, path: string, onProgress?: (percent: number) => void): Promise<string> {
		const client = await this.getClient()
		const tmpCredentials = await client.getStorageTemporaryCredentials({ path })
		const credentials = tmpCredentials.credentials as any
		const cos = new COS({
			getAuthorization(_options, callback) {
				callback({
					TmpSecretId: credentials.tmpSecretId,
					TmpSecretKey: credentials.tmpSecretKey,
					XCosSecurityToken: credentials.sessionToken,
					StartTime: credentials.startTime,
					ExpiredTime: credentials.expiredTime,
				})
			},
		})
		await cos.sliceUploadFile({
			Bucket: tmpCredentials.bucket,
			Region: tmpCredentials.region,
			Key: path,
			Body: file,
			onProgress: (params) => {
				onProgress && onProgress(params.percent)
			}
		})
		return tmpCredentials.url!
	}

	private async getClient(): Promise<StorageApi> {
		const tokenKey = TOKEN_KEY + this._uuid
		const tokenExpiryKey = TOKEN_EXPIRY_KEY + this._uuid

		let token = localStorage.getItem(tokenKey)
		const expiryStr = localStorage.getItem(tokenExpiryKey)
		let expiry = expiryStr ? new Date(expiryStr) : new Date()
		const needRefresh = !token || expiry <= new Date()

		if (needRefresh) {
			// 需要刷新 accessToken
			const result = await this.httpGet<{ access_token: string, expiry: string }>(this._tokenBasePath + "xapis_token", this._token)
			token = result.access_token
			expiry = new Date(result.expiry)
			localStorage.setItem(tokenKey, token)
			localStorage.setItem(tokenExpiryKey, expiry.toISOString())
			this._client = undefined
		}

		if (!this._client) {
			this._client = new StorageApi(new Configuration({ accessToken: token! }))
		}
		return this._client!
	}

	private async httpGet<T>(url: string, token?: string): Promise<T> {
		const headers: HeadersInit = { "content-type": "application/json" }
		if (token) {
			headers["authorization"] = `Bearer ${token}`
		}
		const resp = await this._fetch(url, {
			method: "get",
			headers
		})
		const respText = await resp.text()
		if (resp.ok) {
			return JSON.parse(respText) as T
		} else {
			throw new Error(respText)
		}
	}
}