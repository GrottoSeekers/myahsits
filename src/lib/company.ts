// The company behind MYAH, shown on the legal pages and in footers.
// UK law (Company Trading Disclosures Regulations 2015) needs the name,
// number, place of registration and registered office address on the site.
// Office: the address the owner gave on 27 Oct 2026 ("use this for now").
// Swap it for a registered office service address when there is one.
export const COMPANY = {
  name: 'Myah Sits Ltd',
  number: '17518835',
  registeredIn: 'England and Wales',
  office: '109 The Avenue, Leigh, WN7 1HE',
  email: 'info@myahsits.com',
};

/** "Myah Sits Ltd, registered in England and Wales (company number …), registered office: …" */
export const companyLine = () =>
  [
    `${COMPANY.name}, a company registered in ${COMPANY.registeredIn}`,
    `company number ${COMPANY.number || '[company number to add]'}`,
    COMPANY.office ? `registered office ${COMPANY.office}` : '',
  ].filter(Boolean).join(', ');
