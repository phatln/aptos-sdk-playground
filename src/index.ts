import { run } from "./tapp";
import { deriveCollectionAddress } from "./tapp/derive-collect-addr";

const pkg = "0x487e905f899ccb6d46fdaec56ba1e0c4cf119862a16c409904b8c78fab1f5e8a"; // TAPP package address
console.log("collection:", deriveCollectionAddress(pkg).toString());

run()