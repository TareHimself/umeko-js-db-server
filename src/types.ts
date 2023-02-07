import { IDatabaseGuildSettings, IDatabaseUserSettings } from "./framework";


export interface IGuildUpdate extends Partial<IDatabaseGuildSettings> {
    id: IDatabaseGuildSettings['id']
}

export interface IUserUpdate extends Partial<IDatabaseUserSettings> {
    id: IDatabaseUserSettings['id'];
}

export interface ILevelData {
    user: IDatabaseUserSettings['id'];
    guild: IDatabaseGuildSettings['id'];
    level: number;
    xp: number;
}

export interface ILevelUpdate extends ILevelData {

}

export interface IQueryParameterValidation {
    name: string;
    checkAndGet: (data: string) => Promise<[boolean, any]>;
}