import {Request, Response} from "express";

export interface StartRequest extends Request {
    body: StartRequestData;
}

export interface StartRequestData {
    game_id: string;
    height: number;
    width: number;
}

interface StartSend {
    (status: number, body?: StartResponseData): StartResponse;
    (body?: StartResponseData): StartResponse;
}

export interface StartResponse {
    json: StartSend;
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

interface MoveSend {
    (status: number, body?: MoveResponseData): MoveResponse;
    (body?: MoveResponseData): MoveResponse;
}

export interface MoveResponse {
    json: MoveSend;
}

type Move = "up" | "down" | "left" | "right";

export interface MoveResponseData {
    move: Move;
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
