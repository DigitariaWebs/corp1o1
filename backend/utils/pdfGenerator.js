const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');

/**
 * Generate a certificate PDF by replacing the name in the template
 * @param {string} userName - The user's name to put on the certificate
 * @param {string} certificateId - The certificate ID
 * @param {Date} dateOfIssue - The date of issue (optional, defaults to now)
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateCertificatePDF(userName, certificateId, dateOfIssue = new Date()) {
  try {
    // Load the template PDF
    // Try multiple possible paths
    const possiblePaths = [
      path.join(__dirname, '../../frontend/public/certificate.pdf'),
      path.join(process.cwd(), 'frontend/public/certificate.pdf'),
      path.join(__dirname, '../../../frontend/public/certificate.pdf'),
    ];
    
    let templatePath = null;
    for (const possiblePath of possiblePaths) {
      try {
        await fs.access(possiblePath);
        templatePath = possiblePath;
        break;
      } catch {
        // Continue to next path
      }
    }
    
    if (!templatePath) {
      throw new Error(`Certificate template not found. Tried paths: ${possiblePaths.join(', ')}`);
    }
    
    const templateBytes = await fs.readFile(templatePath);
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    // Get the first page
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    // Embed a font for text replacement
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Find and replace "Marceline Anderson" with the user's name
    // Since PDFs store text in a complex format, we'll overlay the new text
    // The coordinates need to be adjusted based on where the name appears in the template
    
    // Approximate position where "Marceline Anderson" appears (you may need to adjust)
    // Typical certificate layout: name is centered, about 1/3 from top
    const nameX = width / 2;
    const nameY = height * 0.6; // Adjust based on your template
    
    // Add a white rectangle to cover the old text (optional, for cleaner look)
    // firstPage.drawRectangle({
    //   x: nameX - 150,
    //   y: nameY - 15,
    //   width: 300,
    //   height: 30,
    //   color: rgb(1, 1, 1), // White
    // });
    
    // Draw the new name centered
    const fontSize = 32;
    const textWidth = font.widthOfTextAtSize(userName, fontSize);
    const centeredX = nameX - (textWidth / 2);
    
    firstPage.drawText(userName, {
      x: centeredX,
      y: nameY,
      size: fontSize,
      font: font,
      color: rgb(0, 0, 0), // Black
    });
    
    // Add certificate ID below "Certificate ID:" text
    // Typically positioned in bottom left or bottom center area
    const certIdFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const certIdFontSize = 12;
    
    // Estimate position for "Certificate ID:" label (typically around bottom left-center)
    // Adjust these coordinates based on your template layout
    const certIdLabelX = width * 0.65; // right side of page
    const certIdLabelY = height * 0.22; // Bottom area
    
    // Draw certificate ID value below the label
    firstPage.drawText(certificateId, {
      x: certIdLabelX,
      y: certIdLabelY - 20, // Below "Certificate ID:" text
      size: certIdFontSize,
      font: certIdFont,
      color: rgb(0, 0, 0), // Black
    });
    
    // Add date below "Date of Issue:" text
    // Format date as DD/MM/YYYY or MM/DD/YYYY
    const formattedDate = dateOfIssue instanceof Date 
      ? dateOfIssue.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      : new Date(dateOfIssue).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
    
    // Estimate position for "Date of Issue:" label (typically around bottom right)
    const dateLabelX = width * 0.20; // Right side of page
    const dateLabelY = height * 0.22; // Bottom area
    
    // Draw date value below the label
    firstPage.drawText(formattedDate, {
      x: dateLabelX,
      y: dateLabelY - 20, // Below "Date of Issue:" text
      size: certIdFontSize,
      font: certIdFont,
      color: rgb(0, 0, 0), // Black
    });
    
    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();
    
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    throw new Error(`Failed to generate certificate PDF: ${error.message}`);
  }
}

module.exports = {
  generateCertificatePDF,
};

