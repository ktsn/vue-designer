interface ValidationResult {
  success: boolean
  error: string | undefined
}

export declare function name(name: string): ValidationResult
export declare function qname(qname: string): ValidationResult
