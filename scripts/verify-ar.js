const BASE_URL = 'http://localhost:3000/api';
const fs = require('fs');

async function verifyARWorkflow() {
    console.log('🚀 Starting AR Workflow Verification...');

    try {
        // 1. Create a Test Client
        console.log('\n--- Step 1: Creating Test Client ---');
        const clientRes = await fetch(`${BASE_URL}/clients`, {
            method: 'POST',
            body: JSON.stringify({ name: 'Test Client AR', email: 'test_ar@example.com' }),
        });
        if (!clientRes.ok) throw new Error(`Failed to create client: ${clientRes.status} ${await clientRes.text()}`);
        const client = await clientRes.json();
        if (!client.id) throw new Error('Failed to create client: No ID returned');
        console.log('✅ Client created:', client.id);

        // 2. Create Draft Invoice
        console.log('\n--- Step 2: Creating Draft Invoice ---');
        const invoiceRes = await fetch(`${BASE_URL}/invoices`, {
            method: 'POST',
            body: JSON.stringify({
                client_id: client.id,
                date: new Date().toISOString(),
                document_number: `INV-TEST-${Date.now()}`,
                status: 'draft', // Important: Start as draft
                document_type: 'invoice',
                items: [{ description: 'Test Item', quantity: 1, unit_price: 1000 }],
            }),
        });
        if (!invoiceRes.ok) throw new Error(`Failed to create invoice: ${invoiceRes.status} ${await invoiceRes.text()}`);
        const invoice = await invoiceRes.json();
        if (!invoice.id) throw new Error('Failed to create invoice: No ID returned');
        console.log('✅ Draft Invoice created:', invoice.id);

        // 3. Verify NO Transactions for Draft
        console.log('\n--- Step 3: Verifying NO transactions for Draft ---');
        const txRes1 = await fetch(`${BASE_URL}/transactions?invoice_id=${invoice.id}`);
        if (!txRes1.ok) throw new Error(`Failed to fetch transactions (Step 3): ${txRes1.status} ${await txRes1.text()}`);
        const tx1 = await txRes1.json();
        if (tx1.data && tx1.data.length > 0) {
            console.error('❌ Error: Found transactions for draft invoice:', tx1.data);
            throw new Error('Draft invoice should not have transactions');
        }
        console.log('✅ No transactions found (Correct)');

        // 4. Update Status to SENT
        console.log('\n--- Step 4: Updating status to SENT ---');
        const sentRes = await fetch(`${BASE_URL}/invoices/${invoice.id}`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'sent' }),
        });
        if (!sentRes.ok) {
            const errText = await sentRes.text();
            throw new Error(`Failed to update invoice status: ${sentRes.status} ${errText}`);
        }
        const sentInvoice = await sentRes.json();
        console.log('✅ Invoice status updated to SENT');

        // 5. Verify AR Transaction Created
        console.log('\n--- Step 5: Verifying AR Transaction ---');
        const txRes2 = await fetch(`${BASE_URL}/transactions?invoice_id=${invoice.id}`);
        if (!txRes2.ok) throw new Error(`Failed to fetch transactions (Step 5): ${txRes2.status} ${await txRes2.text()}`);
        const tx2 = await txRes2.json();
        const fs = require('fs');
        fs.writeFileSync('debug-tx2.json', JSON.stringify(tx2, null, 2));
        console.log('DEBUG Step 5 tx2 logged to debug-tx2.json');
        const arTx = tx2.data.find(t => t.type === 'revenue' && t.description.includes('Revenue recognition'));

        if (!arTx) {
            console.error('❌ Error: AR Transaction not found. Transactions:', tx2.data);
            throw new Error('AR Transaction missing');
        }
        console.log('✅ AR Transaction found:', arTx.description, '| Amount:', arTx.amount);

        // 6. Record Advance Payment
        console.log('\n--- Step 6: Recording Advance Payment ---');
        // Need an account for payment. Assuming one exists or backend uses default.
        // Wait, I need 'payment_account_id' in PUT body for payment logic to work
        // Let's fetch accounts first to get ID
        const accountsRes = await fetch(`${BASE_URL}/accounts`);
        if (!accountsRes.ok) throw new Error(`Failed to fetch accounts: ${accountsRes.status}`);
        const accounts = await accountsRes.json();
        const cashAccount = (accounts.data || accounts).find(a => a.type === 'asset');

        if (!cashAccount) throw new Error('No asset account found for payment');

        const payRes = await fetch(`${BASE_URL}/invoices/${invoice.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                advance_paid: 200,
                payment_account_id: cashAccount.id
            }),
        });
        if (!payRes.ok) {
            const errText = await payRes.text();
            throw new Error(`Failed to record payment: ${payRes.status} ${errText}`);
        }
        await payRes.json();
        console.log('✅ Advance payment recorded');

        // 7. Verify Payment Transaction (Transfer)
        console.log('\n--- Step 7: Verifying Payment Transaction ---');
        const txRes3 = await fetch(`${BASE_URL}/transactions?invoice_id=${invoice.id}`);
        if (!txRes3.ok) throw new Error(`Failed to fetch transactions (Step 7): ${txRes3.status} ${await txRes3.text()}`);
        const tx3 = await txRes3.json();
        const payTx = tx3.data.find(t => t.type === 'transfer' && t.description.includes('Payment received'));

        if (!payTx) {
            console.error('❌ Error: Payment Transaction not found. Transactions:', tx3.data);
            throw new Error('Payment Transaction missing');
        }
        console.log('✅ Payment Transaction found:', payTx.description, '| Amount:', payTx.amount);

        // 8. Delete Invoice
        console.log('\n--- Step 8: Deleting Invoice ---');
        const delRes = await fetch(`${BASE_URL}/invoices/${invoice.id}`, {
            method: 'DELETE',
        });
        if (!delRes.ok) throw new Error(`Failed to delete invoice: ${delRes.status} ${await delRes.text()}`);
        console.log('✅ Invoice deleted');

        // 9. Verify All Transactions Deleted
        console.log('\n--- Step 9: Verifying Cleanup ---');
        const txRes4 = await fetch(`${BASE_URL}/transactions?invoice_id=${invoice.id}`);
        if (!txRes4.ok) throw new Error(`Failed to fetch transactions (Step 9): ${txRes4.status} ${await txRes4.text()}`);
        const tx4 = await txRes4.json();

        if (tx4.data && tx4.data.length > 0) {
            console.error('❌ Error: Transactions still exist after delete:', tx4.data);
            throw new Error('Cleanup failed');
        }
        console.log('✅ All transactions deleted (Correct)');

        console.log('\n🎉 VERIFICATION SUCCESSFUL! 🎉');

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED:', error);
        fs.writeFileSync('verification-error.log', JSON.stringify(error, Object.getOwnPropertyNames(error), 2) + '\n' + (error.cause || ''));
    }
}

verifyARWorkflow();
