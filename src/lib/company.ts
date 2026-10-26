// The company behind MYAH, shown on the legal pages and in footers.
// UK law (Company Trading Disclosures Regulations 2015) needs the name,
// number, place of registration and registered office address on the site.
// OFFICE is left empty on purpose: the registered office is currently the
// founders' home, which must not go on the site. Once it moves to a registered
// office service address, put that address here (the law needs it shown).
export const COMPANY = {
  name: 'Myah Sits Ltd',
  number: '17518835',
  registeredIn: 'England and Wales',
  office: '',
  email: 'info@myahsits.com',
};

/** "Myah Sits Ltd, registered in England and Wales (company number …), registered office: …" */
export const companyLine = () =>
  [
    `${COMPANY.name}, a company registered in ${COMPANY.registeredIn}`,
    `company number ${COMPANY.number || '[company number to add]'}`,
    COMPANY.office ? `registered office ${COMPANY.office}` : '',
  ].filter(Boolean).join(', ');
