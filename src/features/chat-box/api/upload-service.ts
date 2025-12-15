import { env } from "@/config/env";
import { API_ROUTES } from "@/lib/api-routes";

export async function uploadFile(file: File): Promise<any> {
  const form = new FormData();
  form.append("file", file);

  const url = env.UPLOAD_SERVER_URL + API_ROUTES.UPLOAD_FILE;

  const res = await fetch(url, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    let errorMessage = `Upload failed: ${res.status} ${res.statusText}`;
    try {
      const errorBody = await res.json();
      errorMessage = errorBody.error || errorMessage;
    } catch { }

    throw new Error(errorMessage);
  }

  return await res.json();
}