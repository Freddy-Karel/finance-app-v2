import { redirect } from "next/navigation";

export default function Home() {
  // Redirige la racine vers le tableau de bord de l'app
  redirect("/dashboard");
}
