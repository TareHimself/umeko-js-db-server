
export interface IGuildData {
    id: string;
    bot_opts: string;
    join_opts: string;
    leave_opts: string;
    twitch_opts: string;
    level_opts: string;
    opts: string;
}

export interface IGuildUpdate extends Partial<IGuildData> {
    id: IGuildData['id']
}

export interface IUserData {
    id: string;
    card: string;
    opts: string;
    flags: number;
}

export interface IUserUpdate extends Partial<IUserData> {
    id: IUserData['id'];
}

export interface ILevelData {
    user: IUserData['id'];
    guild: IGuildData['id'];
    level: number;
    xp: number;
}

export interface ILevelUpdate extends ILevelData {

}

export interface IQueryParameterValidation {
    name: string;
    checkAndGet: (data: string) => Promise<[boolean, any]>;
}