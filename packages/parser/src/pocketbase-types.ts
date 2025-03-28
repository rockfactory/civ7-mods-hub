/**
* This file was @generated using pocketbase-typegen
*/

import type PocketBase from 'pocketbase'
import type { RecordService } from 'pocketbase'

export enum Collections {
	Authorigins = "_authOrigins",
	Externalauths = "_externalAuths",
	Mfas = "_mfas",
	Otps = "_otps",
	Superusers = "_superusers",
	ModVersions = "mod_versions",
	Mods = "mods",
	ScheduledTasks = "scheduled_tasks",
	Users = "users",
}

// Alias types for improved usability
export type IsoDateString = string
export type RecordIdString = string
export type HTMLString = string

// System fields
export type BaseSystemFields<T = never> = {
	id: RecordIdString
	collectionId: string
	collectionName: Collections
	expand?: T
}

export type AuthSystemFields<T = never> = {
	email: string
	emailVisibility: boolean
	username: string
	verified: boolean
} & BaseSystemFields<T>

// Record types for each collection

export type AuthoriginsRecord = {
	collectionRef: string
	created?: IsoDateString
	fingerprint: string
	id: string
	recordRef: string
	updated?: IsoDateString
}

export type ExternalauthsRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	provider: string
	providerId: string
	recordRef: string
	updated?: IsoDateString
}

export type MfasRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	method: string
	recordRef: string
	updated?: IsoDateString
}

export type OtpsRecord = {
	collectionRef: string
	created?: IsoDateString
	id: string
	password: string
	recordRef: string
	sentTo?: string
	updated?: IsoDateString
}

export type SuperusersRecord = {
	created?: IsoDateString
	email: string
	emailVisibility?: boolean
	id: string
	password: string
	tokenKey: string
	updated?: IsoDateString
	verified?: boolean
}

export type ModVersionsRecord = {
	affect_saves?: boolean
	archive_hash?: string
	archive_size?: number
	cf_id?: string
	created?: IsoDateString
	download_error?: boolean
	download_url?: string
	hash?: string
	hash_stable?: string
	id: string
	is_external_download?: boolean
	is_processing?: boolean
	mod_id: RecordIdString
	modinfo_id?: string
	modinfo_url?: string
	modinfo_version?: string
	name?: string
	rating?: number
	released?: IsoDateString
	skip_install?: boolean
	updated?: IsoDateString
}

export type ModsRecord = {
	author?: string
	category?: string
	cf_id?: string
	created?: IsoDateString
	downloads_count?: number
	icon_url?: string
	id: string
	is_hidden?: boolean
	mod_released?: IsoDateString
	mod_updated?: IsoDateString
	modinfo_id?: string
	name?: string
	rating?: number
	short_description?: string
	updated?: IsoDateString
	url?: string
	versions?: RecordIdString[]
}

export type ScheduledTasksRecord<Toptions = unknown> = {
	created?: IsoDateString
	id: string
	is_processed?: boolean
	options?: null | Toptions
	processed_at?: IsoDateString
	updated?: IsoDateString
}

export type UsersRecord = {
	avatar?: string
	created?: IsoDateString
	email: string
	emailVisibility?: boolean
	id: string
	name?: string
	password: string
	tokenKey: string
	updated?: IsoDateString
	verified?: boolean
}

// Response types include system fields and match responses from the PocketBase API
export type AuthoriginsResponse<Texpand = unknown> = Required<AuthoriginsRecord> & BaseSystemFields<Texpand>
export type ExternalauthsResponse<Texpand = unknown> = Required<ExternalauthsRecord> & BaseSystemFields<Texpand>
export type MfasResponse<Texpand = unknown> = Required<MfasRecord> & BaseSystemFields<Texpand>
export type OtpsResponse<Texpand = unknown> = Required<OtpsRecord> & BaseSystemFields<Texpand>
export type SuperusersResponse<Texpand = unknown> = Required<SuperusersRecord> & AuthSystemFields<Texpand>
export type ModVersionsResponse<Texpand = unknown> = Required<ModVersionsRecord> & BaseSystemFields<Texpand>
export type ModsResponse<Texpand = unknown> = Required<ModsRecord> & BaseSystemFields<Texpand>
export type ScheduledTasksResponse<Toptions = unknown, Texpand = unknown> = Required<ScheduledTasksRecord<Toptions>> & BaseSystemFields<Texpand>
export type UsersResponse<Texpand = unknown> = Required<UsersRecord> & AuthSystemFields<Texpand>

// Types containing all Records and Responses, useful for creating typing helper functions

export type CollectionRecords = {
	_authOrigins: AuthoriginsRecord
	_externalAuths: ExternalauthsRecord
	_mfas: MfasRecord
	_otps: OtpsRecord
	_superusers: SuperusersRecord
	mod_versions: ModVersionsRecord
	mods: ModsRecord
	scheduled_tasks: ScheduledTasksRecord
	users: UsersRecord
}

export type CollectionResponses = {
	_authOrigins: AuthoriginsResponse
	_externalAuths: ExternalauthsResponse
	_mfas: MfasResponse
	_otps: OtpsResponse
	_superusers: SuperusersResponse
	mod_versions: ModVersionsResponse
	mods: ModsResponse
	scheduled_tasks: ScheduledTasksResponse
	users: UsersResponse
}

// Type for usage with type asserted PocketBase instance
// https://github.com/pocketbase/js-sdk#specify-typescript-definitions

export type TypedPocketBase = PocketBase & {
	collection(idOrName: '_authOrigins'): RecordService<AuthoriginsResponse>
	collection(idOrName: '_externalAuths'): RecordService<ExternalauthsResponse>
	collection(idOrName: '_mfas'): RecordService<MfasResponse>
	collection(idOrName: '_otps'): RecordService<OtpsResponse>
	collection(idOrName: '_superusers'): RecordService<SuperusersResponse>
	collection(idOrName: 'mod_versions'): RecordService<ModVersionsResponse>
	collection(idOrName: 'mods'): RecordService<ModsResponse>
	collection(idOrName: 'scheduled_tasks'): RecordService<ScheduledTasksResponse>
	collection(idOrName: 'users'): RecordService<UsersResponse>
}
