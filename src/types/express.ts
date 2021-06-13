import { Request, Response, RouteParameters } from 'express-serve-static-core';
import { ParsedQs } from 'qs';

type Route = string;
type P = RouteParameters<Route>;
type ResBody = any;
type ReqBody = any;
type ReqQuery = ParsedQs;
type Locals = Record<string, any>;

export type ExpressRequest = Request<P, ResBody, ReqBody, ReqQuery, Locals>

export type ExpressResponse = Response<ResBody, Locals>
