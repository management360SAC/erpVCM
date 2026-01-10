import React, { useRef, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ProposalVCMPreview() {
  const [open, setOpen] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const handleDownloadPdf = async () => {
    if (!docRef.current) return;

    const canvas = await html2canvas(docRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", margin, margin, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save("Carta-Presentacion-VCM.pdf");
  };

  return (
    <Box>
      <Button variant="contained" onClick={handleOpen}>
        Previsualizar Carta de Presentación
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Carta de Presentación — GRUPO VCM</DialogTitle>
        <DialogContent dividers>
          <Box
            ref={docRef}
            sx={{
              width: "794px", // A4
              bgcolor: "#fff",
              color: "#222",
              mx: "auto",
              p: 4,
              borderRadius: 2,
              border: "1px solid #ddd",
            }}
          >
            {/* LOGO SUPERIOR */}
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <img
                src="https://storage.googleapis.com/corpsolution/vcm-logo.png"
                alt="VCM"
                style={{
                  width: 220,
                  height: "auto",
                  objectFit: "contain",
                }}
              />
            </Box>

            {/* ENCABEZADO */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Estimados Señores
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 700 }}>
                AVANLAB PERU SAC
              </Typography>
            </Box>

            {/* CUERPO DE TEXTO */}
            <Box sx={{ display: "grid", gap: 2, textAlign: "justify" }}>
              <Typography variant="body1">
                Con sumo agrado, recibimos la invitación para presentar nuestra
                propuesta de servicios profesionales para su prestigiosa empresa
                (En adelante la Compañía). El éxito de nuestros clientes siempre
                ha sido una prioridad para nuestra firma y estamos totalmente
                comprometidos a ayudarlos a lograr su objetivo. Nuestra
                consultoría está enfocada en darle solución a medida, pero lo más
                importante es generar valor con el cumplimiento de sus
                entregables de manera eficiente y con altos estándares de
                calidad.
              </Typography>

              <Typography variant="body1">
                Asumimos esta oportunidad con un alto sentido de responsabilidad y
                tengan la certeza que destinaremos nuestros mejores recursos para
                contribuir desde nuestras funciones a acompañarlos en su
                crecimiento.
              </Typography>

              <Typography variant="body1">
                Nuestros socios asignados cuentan con un alto índice de
                conocimiento y experiencia no solo a nivel local respecto a su
                sector, sino también internacional; nos enfocamos en realizar
                consultorías con herramientas modernas usando la tecnología tanto
                en el ámbito financiero, contable, laboral y fiscal, que incluye
                el modelamiento de procesos para grupos económicos.
              </Typography>

              <Typography variant="body1">
                Presentamos a nuestra empresa{" "}
                <b>VCM Group (GRUPO VCM S.A.C.)</b> y su plataforma de servicios
                especializados, donde nuestra firma brinda soluciones contables,
                fiscales y administrativas a la medida, con la finalidad de
                optimizar tiempos y mejorar la calidad de la presentación,
                reduciendo la carga de tiempo de los analistas y supervisores
                contables.
              </Typography>

              <Typography variant="body1">
                Contamos con un equipo profesional de mucha{" "}
                <b>idoneidad</b> y <b>transparencia profesional</b>, primando la
                buena reputación y la experiencia; hemos participado durante 15
                años en atender a diversos clientes priorizando su satisfacción
                respecto a la calidad del servicio, tanto para grupos económicos
                más grandes del país y grupos familiares de los sectores de
                construcción, inmobiliario, agroexportador, electricidad,
                financieras, retail, mineros, seguros y agroindustrial. Nuestros
                socios consultores tienen más de 25 años de experiencia.
              </Typography>

              <Typography variant="body1">
                Esperamos que la presente propuesta le provea toda la información
                necesaria para ser distinguidos con su elección y le expresamos
                nuestro compromiso para satisfacer sus requerimientos y
                expectativas con la calidad, seriedad, eficiencia y oportunidad
                que ustedes merecen. Quedamos a su disposición para responder a
                cualquier pregunta o solicitud.
              </Typography>
            </Box>

            {/* FIRMA */}
            <Box sx={{ textAlign: "center", mt: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Atentamente,
              </Typography>
              <Typography variant="subtitle1" fontWeight={800}>
                MARIO H. VILLARREYES
              </Typography>
              <Typography variant="body2" color="text.secondary">
                SOCIO - CONSULTOR
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* LOGO INFERIOR */}
            <Box sx={{ textAlign: "right" }}>
              <img
                src="https://storage.googleapis.com/corpsolution/vcm-footer.png"
                alt="VCM Footer"
                style={{ width: 120, height: "auto", objectFit: "contain" }}
              />
            </Box>
          </Box>
        </DialogContent>

        <Stack direction="row" justifyContent="space-between" sx={{ p: 2 }}>
          <Button onClick={handleClose} variant="outlined">
            Cerrar
          </Button>
          <Button variant="contained" onClick={handleDownloadPdf}>
            Descargar PDF
          </Button>
        </Stack>
      </Dialog>
    </Box>
  );
}
