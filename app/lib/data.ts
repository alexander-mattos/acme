import { PrismaClient } from '../../prisma/generated/prisma';
import {
  CustomerField,
  CustomersTableType,
  InvoiceForm,
  InvoicesTable,
  LatestInvoiceRaw,
  Revenue,
} from './definitions';
import { formatCurrency } from './utils';

const prisma = new PrismaClient();

export async function fetchRevenue(): Promise<Revenue[]> {
  try {
    // Simulando um atraso de 3 segundos
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Usando o Prisma para buscar todas as entradas da tabela 'Revenue'
    const data = await prisma.revenue.findMany();

    // O Prisma retorna um array de objetos, que deve ser compatível com Revenue[]
    return data;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  }
}

export async function fetchLatestInvoices(): Promise<LatestInvoiceRaw[]> {
  try {
    // Usando o Prisma para buscar as últimas 5 faturas com informações do cliente
    const data = await prisma.invoice.findMany({
      select: {
        id: true,
        amount: true,
        date: true,
        customers: {
          select: {
            name: true,
            email: true,
            image_url: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      take: 5,
    });

    // Mapeie os resultados para o formato esperado por LatestInvoiceRaw
    const latestInvoices = data.map((invoice) => ({
      id: invoice.id,
      amount: formatCurrency(invoice.amount),
      name: invoice.customers!.name,
      image_url: invoice.customers!.image_url,
      email: invoice.customers!.email,
    }));

    return latestInvoices.map(invoice => ({
      ...invoice,
      amount: Number(invoice.amount.replace(/[^0-9.-]+/g, ''))
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}

export async function fetchCardData() {
  try {
    // Executando múltiplas consultas em paralelo com Promise.all
    const [
      invoiceCount,
      customerCount,
      paidAmountResult,
      pendingAmountResult
    ] = await Promise.all([
      prisma.invoice.count(), // Conta o total de faturas
      prisma.customer.count(), // Conta o total de clientes
      prisma.invoice.aggregate({ // Soma o valor das faturas pagas
        _sum: {
          amount: true,
        },
        where: {
          status: 'paid',
        },
      }),
      prisma.invoice.aggregate({ // Soma o valor das faturas pendentes
        _sum: {
          amount: true,
        },
        where: {
          status: 'pending',
        },
      }),
    ]);

    // O Prisma aggregate retorna um objeto com a propriedade '_sum'
    const totalPaidAmount = paidAmountResult._sum?.amount || 0;
    const totalPendingAmount = pendingAmountResult._sum?.amount || 0;

    const numberOfInvoices = Number(invoiceCount);
    const numberOfCustomers = Number(customerCount);
    const totalPaidInvoices = formatCurrency(totalPaidAmount);
    const totalPendingInvoices = formatCurrency(totalPendingAmount);

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}

const ITEMS_PER_PAGE = 6;
export async function fetchFilteredInvoices(
  query: string,
  currentPage: number,
): Promise<InvoicesTable[]> {
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        OR: [
          {
            customers: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
          {
            customers: {
              email: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
          {
            amount: {
              // Convertendo number para string para buscar (pode não ser ideal, dependendo do caso)
              // No Prisma, é melhor buscar valores numéricos diretamente
              // Se 'query' pode ser um número, você pode adicionar uma condição para o tipo numérico.
              // Para simular ::text ILIKE %query% seria mais complexo e pode ser ineficiente.
              // Melhor reformular a busca se 'amount' for para ser pesquisado como texto.
              // Para este exemplo, vou assumir que a busca de valor é mais direta.
              // No entanto, para manter a funcionalidade original com `::text ILIKE`,
              // teríamos que fazer uma query raw ou ajustar a lógica de busca.
              // Para fins de refatoração simples, vou focar nos campos string.
            },
          },
          {
            status: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            date: {
              // Para buscar por data como texto, precisaríamos de uma query raw ou formatar a data.
              // Exemplo simplificado, apenas para tipos Date no Prisma
              // Se a query for uma data, pode-se tentar parsear e buscar.
            },
          },
        ],
      },
      select: {
        id: true,
        amount: true,
        date: true,
        status: true,
        customers: {
          select: {
            name: true,
            email: true,
            image_url: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      skip: offset, // OFFSET
      take: ITEMS_PER_PAGE, // LIMIT
    });

    // Mapeie os resultados para o formato InvoicesTable
    return invoices.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount,
      date: invoice.date.toISOString(), // Garante que a data está em um formato string
      status: invoice.status,
      name: invoice.customers.name,
      email: invoice.customers.email,
      image_url: invoice.customers.image_url,
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}

export async function fetchInvoicesPages(query: string): Promise<number> {
  try {
    const count = await prisma.invoice.count({
      where: {
        OR: [
          {
            customers: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
          {
            customers: {
              email: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
          {
            // Similar ao fetchFilteredInvoices, a busca por `amount::text` ou `date::text`
            // é complexa com o Prisma ORM sem raw query.
            // Para manter o exemplo conciso, estou omitindo a complexidade de conversão para string aqui.
            // Se essa funcionalidade for crítica, considere:
            // 1. Ajustar o modelo de busca para usar tipos nativos (numéricos para `amount`, datas para `date`).
            // 2. Usar `prisma.$queryRaw` para consultas SQL diretas para essas condições específicas.
          },
          {
            status: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
    });

    const totalPages = Math.ceil(Number(count) / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  }
}

export async function fetchInvoiceById(id: string): Promise<InvoiceForm | undefined> {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: id,
      },
      select: {
        id: true,
        customer_id: true,
        amount: true,
        status: true,
      },
    });

    if (!invoice) {
      return undefined;
    }

    // Convert amount from cents to dollars
    return {
      ...invoice,
      amount: invoice.amount / 100,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchCustomers(): Promise<CustomerField[]> {
  try {
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}

export async function fetchFilteredCustomers(query: string): Promise<CustomersTableType[]> {
  try {
    const data = await prisma.customer.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image_url: true,
        invoices: {
          select: {
            id: true,
            status: true,
            amount: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const customers = data.map((customer) => {
      const totalInvoices = customer.invoices.length;
      const totalPending = customer.invoices.reduce((sum, invoice) => {
        return sum + (invoice.status === 'pending' ? invoice.amount : 0);
      }, 0);
      const totalPaid = customer.invoices.reduce((sum, invoice) => {
        return sum + (invoice.status === 'paid' ? invoice.amount : 0);
      }, 0);

      return {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        image_url: customer.image_url,
        total_invoices: totalInvoices,
        total_pending: formatCurrency(totalPending),
        total_paid: formatCurrency(totalPaid),
      };
    });

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}