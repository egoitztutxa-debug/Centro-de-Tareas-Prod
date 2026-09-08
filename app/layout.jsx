import "./globals.css";

export const metadata = {
  title: "Centro de tareas",
  description: "SuccessFactors · Time Tracking — Centro de tareas",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
