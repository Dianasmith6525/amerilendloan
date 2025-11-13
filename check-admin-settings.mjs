import { getDb } from './server/db.ts';
import { eq } from 'drizzle-orm';
import { systemSettings, loanApplications } from './drizzle/schema.ts';

async function checkAdminSettings() {
  try {
    console.log('🔍 Checking Admin Settings and Document Access...\n');

    const database = await getDb();
    if (!database) {
      console.error('❌ Database not available');
      return;
    }

    // Check system settings
    console.log('📋 System Settings:');
    const settings = await database.select().from(systemSettings);
    if (settings.length === 0) {
      console.log('⚠️  No system settings found');
    } else {
      settings.forEach(setting => {
        console.log(`  ${setting.key}: ${setting.value || '(empty)'}`);
      });
    }

    console.log('\n📄 Loan Applications with ID Documents:');
    const loansWithDocs = await database
      .select({
        id: loanApplications.id,
        referenceNumber: loanApplications.referenceNumber,
        fullName: loanApplications.fullName,
        idFrontUrl: loanApplications.idFrontUrl,
        idBackUrl: loanApplications.idBackUrl,
        selfieUrl: loanApplications.selfieUrl,
        idVerificationStatus: loanApplications.idVerificationStatus,
        status: loanApplications.status,
      })
      .from(loanApplications)
      .where(eq(loanApplications.idFrontUrl, null).not()); // Has ID front

    if (loansWithDocs.length === 0) {
      console.log('⚠️  No loan applications with ID documents found');
    } else {
      loansWithDocs.forEach(loan => {
        console.log(`  Loan #${loan.id} (${loan.referenceNumber}): ${loan.fullName}`);
        console.log(`    Status: ${loan.status}, ID Verification: ${loan.idVerificationStatus}`);
        console.log(`    ID Front: ${loan.idFrontUrl ? '✅ Present' : '❌ Missing'}`);
        console.log(`    ID Back: ${loan.idBackUrl ? '✅ Present' : '❌ Missing'}`);
        console.log(`    Selfie: ${loan.selfieUrl ? '✅ Present' : '❌ Missing'}`);
        console.log('');
      });
    }

    console.log('📊 Summary:');
    console.log(`  Total system settings: ${settings.length}`);
    console.log(`  Loans with ID documents: ${loansWithDocs.length}`);

    // Check for potential issues
    console.log('\n🔧 Potential Issues:');

    // Check if crypto wallets are set
    const cryptoSettings = settings.filter(s => s.category === 'crypto');
    if (cryptoSettings.length === 0) {
      console.log('⚠️  No crypto wallet settings configured');
    } else {
      console.log('✅ Crypto wallets configured');
    }

    // Check if email settings are set
    const emailSettings = settings.filter(s => s.category === 'email');
    if (emailSettings.length === 0) {
      console.log('⚠️  No email settings configured');
    } else {
      console.log('✅ Email settings configured');
    }

    // Check if company settings are set
    const companySettings = settings.filter(s => s.category === 'company');
    if (companySettings.length === 0) {
      console.log('⚠️  No company settings configured');
    } else {
      console.log('✅ Company settings configured');
    }

    // Check document storage
    if (loansWithDocs.length > 0) {
      const dataUrlDocs = loansWithDocs.filter(l => l.idFrontUrl?.startsWith('data:'));
      const filePathDocs = loansWithDocs.filter(l => l.idFrontUrl && !l.idFrontUrl.startsWith('data:'));

      console.log(`✅ Documents stored as data URLs: ${dataUrlDocs.length}`);
      if (filePathDocs.length > 0) {
        console.log(`⚠️  Documents stored as file paths: ${filePathDocs.length} (may not display correctly)`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking admin settings:', error);
  }
}

checkAdminSettings();
