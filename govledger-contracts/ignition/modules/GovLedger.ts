import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const GovLedgerModule = buildModule("GovLedgerModule", (m) => {
  // Diz ao Ignition para fazer o deploy do contrato "GovLedger"
  const govLedger = m.contract("GovLedger");

  return { govLedger };
});

export default GovLedgerModule;