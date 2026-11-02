import ExcelJS from 'exceljs';import JSZip from 'jszip';
/** ExcelJS expects unprefixed SpreadsheetML tags. Normalize equivalent prefixes in memory only. */
export async function loadWorkbook(bytes:Buffer){
 const zip=await JSZip.loadAsync(bytes);let changed=false;let expanded=0;
 for(const entry of Object.values(zip.files)){if(entry.dir)continue;const size=(entry as any)._data?.uncompressedSize||0;expanded+=size;if(expanded>100*1024*1024)throw Error('Распакованная книга превышает 100 МБ');}
 for(const [name,entry] of Object.entries(zip.files)){if(!name.startsWith('xl/')||!name.endsWith('.xml'))continue;let xml=await entry.async('string');const declarations=[...xml.matchAll(/xmlns:([\w]+)=["']([^"']+)["']/g)];for(const [,prefix,uri] of declarations){if(uri==='http://schemas.openxmlformats.org/spreadsheetml/2006/main'){xml=xml.replace(new RegExp('(<\\/?)'+prefix+':','g'),'$1').replace(new RegExp('xmlns:'+prefix+'='),'xmlns=');changed=true;}else if(uri==='http://schemas.openxmlformats.org/officeDocument/2006/relationships'&&prefix!=='r'){xml=xml.replace(new RegExp('\\b'+prefix+':','g'),'r:').replace(new RegExp('xmlns:'+prefix+'='),'xmlns:r=');changed=true;}}if(changed)zip.file(name,xml);}
 const book=new ExcelJS.Workbook();await book.xlsx.load((changed?await zip.generateAsync({type:'nodebuffer'}):bytes) as any);return book;
}
