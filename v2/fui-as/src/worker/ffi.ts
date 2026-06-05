@external("fui_worker_host", "fui_worker_input_length")
export declare function fui_worker_input_length(): u32;

@external("fui_worker_host", "fui_worker_copy_input")
export declare function fui_worker_copy_input(ptr: usize, capacity: u32): u32;

@external("fui_worker_host", "fui_worker_report_progress")
export declare function fui_worker_report_progress(ptr: usize, len: u32): void;

@external("fui_worker_host", "fui_worker_complete_string")
export declare function fui_worker_complete_string(ptr: usize, len: u32): void;

@external("fui_worker_host", "fui_worker_fail")
export declare function fui_worker_fail(ptr: usize, len: u32): void;

@external("fui_worker_host", "fui_worker_is_cancelled")
export declare function fui_worker_is_cancelled(): bool;

@external("fui_worker_host", "fui_worker_request_yield")
export declare function fui_worker_request_yield(): void;

@external("fui_worker_host", "fui_worker_request_yield_delay")
export declare function fui_worker_request_yield_delay(delayMs: i32): void;

@external("fui_worker_host", "fui_file_read_chunk")
export declare function fui_file_read_chunk(offsetLow: i32, offsetHigh: i32, length: i32): i32;

@external("fui_worker_host", "fui_file_worker_write_chunk")
export declare function fui_file_worker_write_chunk(ptr: usize, len: i32): void;
