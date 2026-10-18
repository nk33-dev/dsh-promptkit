/** 宿主适配器未及时响应 AbortSignal 时，仍让调用方按时退出。 */
export declare function abortable<T>(operation: Promise<T>, signal: AbortSignal): Promise<T>;
