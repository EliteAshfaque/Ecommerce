// Backward-compatible module name: consumers importing ProfileDropdown receive the
// current ProfilePanel implementation, so account UI stays centralized in one component.
export { default } from "./ProfilePanel";
