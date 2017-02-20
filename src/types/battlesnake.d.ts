import {Request} from "express";

export interface StartRequest extends Request {
    body: StartRequestData;
}

export interface StartRequestData {
    game_id: string;
    height: number;
    width: number;
}

export interface StartResponseData {
    color: string;
    name: string;
    head_url?: string;
    taunt?: string;
}

export interface MoveRequest extends Request {
    body: MoveRequestData
}

export interface MoveRequestData {
    game_id: string;
    height: number;
    width: number;
    turn: number;
    you: string;
    food: Point[];
    snakes: Snake[];
}

export interface MoveResponseData {
    move: "up"|"left"|"down"|"right";
    taunt?: string;
}

export type Point = [number, number];

export interface Snake {
    id: string;
    name: string;
    taunt: string;
    health_points: number;
    coords: Point[];
}
