// In order to facilitate the download, we're going to allocate Object URLs.
// We'll need to keep track of those so we can manage the browser memory.
let downloadUrl = null;
const downloadLink = document.querySelector('a[download]');

ZOHO.embeddedApp.on("PageLoad", async function(data){
  try {
    let pageNum = 1
    let more = true
    const dataArr = []
    while (more) {
      const response = await ZOHO.CRM.API.getAllRecords({Entity:"Deals",sort_order:"asc",per_page:200,page:pageNum})
      updateDownloadHref(response.data)
      more = response.info.more_records
      pageNum++
      dataArr.push(...response.data)
    }
    updateDownloadHref(dataArr)
  } catch (err) {
    console.log({ err })
  }
});

ZOHO.embeddedApp.init();

function generateCsv(data) {
  const csvRows = data.map((item) => {
    const propertyOwner = item.Property_Owners ? JSON.parse(item.Property_Owners)[0] : null
    const propertyContact = item.Property_Contacts ? JSON.parse(item.Property_Contacts)[0] : null
    const info = {
      'Property Name': item.Deal_Name,
      'Owner': propertyOwner ? propertyOwner.Company : null,
      'Attention': propertyOwner ? propertyOwner.Salutation_Dear : null,
      'Owner - Postal Street': propertyOwner ? propertyOwner.Postal_Street : null,
      'Owner - Postal State': propertyOwner ? propertyOwner.Postal_State : null,
      'Owner - Postal Postcode': propertyOwner ? propertyOwner.Postal_Postcode : null,
      'Related Contact': propertyContact ? propertyContact.Name : null,
      'Related Contact Salutation': propertyContact ? propertyContact.Salutation_Dear : null,
      'Agent Name': item.Sales_Agent,
      'Date to Start': item.Date_to_Start,
      'Property Description': item.Property_Description,
      'Location Description': item.Loaction_Description,
      'Zoning': item.Prop_Zoning,
      'Property - Council': item.Council,
      'Property - Land Area': item.Land_Area_sqm,
      'Property - Warehouse': item.Warehouse_sqm,
      'Property - Office': item.Office_area_sqm,
      'Property - Showroom': item.Showroom_sqm,
      'Property - Retail': item.Retail_sqm,
      'Access': item.Access,
      'Property - Car Spaces': item.Car_Spaces,
      'Current Use': item.Current_Use,
      'Auction Date and Time': item.Auction_Date_Time1,
      'Target Market': item.Target_Market,
      'Sale Price': item.Sale_Price,
      'Appeal': item.Appeal
    }
    return Object.values(info).map((leadValue) => {
      const string = JSON.stringify(leadValue)
      return string
    }).join(',')
  }).join('\n');
  const csvHeaders = 'Property Name,Owner,Attention,Owner - Postal Street,Owner - Postal State,Owner - Postal Postcode,Related Contact,Related Contact Salutation,Agent Name,Date to Start,Property Description,Location Description,Zoning,Property - Council,Property - Land Area,Property - Warehouse,Property - Office,Property - Showroom,Property - Retail,Access,Property - Car Spaces,Current Use,Auction Date and Time,Target Market,Sale Price,Appeal';
  return `${csvHeaders}\n${csvRows}\n`;
}

function updateDownloadHref(data) {
  // Create a binary representation of the plain-text input.
  const csvData = generateCsv(data);
  const blob = new Blob(
      [csvData], // Blob parts.
      {
          type : "text/csv;charset=utf-8"
      }
  );

  // When we create Object URLs, the browser will keep them in memory until the
  // document is unloaded or until the URL is explicitly released. Since we are
  // going to create a new URL every time the user hits a key-stroke (in this
  // particular demo), we need to be sure to release the previous Object URL
  // before we create the new one.
  if ( downloadUrl ) {
      URL.revokeObjectURL( downloadUrl );
  }

  // Create an addressable version of the blob.
  // --
  // CAUTION: At this point, the URL has been allocated and the blob will be
  // kept in the document memory space until the document is unloaded or the
  // URL is explicitly released (see above).
  downloadUrl = URL.createObjectURL( blob );

  // Tie the addressable version of the blob to the download link.
  downloadLink.setAttribute( "href", downloadUrl );
}