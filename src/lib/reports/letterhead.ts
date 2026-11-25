export const reportLetterheadStyles = `
.letterhead { display: grid; grid-template-columns: 72px minmax(0, 1fr) 72px; align-items: center; gap: 12px; border-bottom: 3px double #34443a; padding-bottom: 10px; margin-bottom: 16px; text-align: center; }
.letterhead img { width: 72px; height: 72px; object-fit: contain; }
.letterhead p { margin: 2px 0; line-height: 1.15; }
.letterhead .place { font-size: 10px; }
.letterhead .municipality { font-size: 13px; font-weight: 700; }
.letterhead .office { font-size: 10px; font-weight: 700; }
.letterhead .contact { font-size: 9px; }
`;

export function getReportLetterheadHtml() {
  const menroLogoUrl = new URL(
    "/letterhead-menro.png",
    window.location.origin
  ).toString();
  const jasaanSealUrl = new URL(
    "/letterhead-jasaan-seal.jpg",
    window.location.origin
  ).toString();

  return `<header class="letterhead">
  <img src="${menroLogoUrl}" alt="Municipal Environment and Natural Resources Office seal">
  <div>
    <p class="place">Republic of the Philippines</p>
    <p class="place">Province of Misamis Oriental</p>
    <p class="municipality">MUNICIPALITY OF JASAAN</p>
    <p class="place">-o0o-</p>
    <p class="office">MUNICIPAL ENVIRONMENT AND NATURAL RESOURCES OFFICE</p>
    <p class="contact">Email: menrojasaan@gmail.com / Facebook: Menro Jasaan</p>
  </div>
  <img src="${jasaanSealUrl}" alt="Municipality of Jasaan seal">
</header>`;
}
