import { createNavItem } from "@/actions/nav-items";
import { NavItemForm } from "../nav-item-form";

export const metadata = { title: "New nav item" };

export default function NewNavItemPage() {
  return <NavItemForm action={createNavItem} submitLabel="Create nav item" />;
}
