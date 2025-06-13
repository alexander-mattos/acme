import { customers } from "@/app/lib/placeholder-data";
import { PrismaClient } from "../prisma/generated/prisma";

const prisma = new PrismaClient();

const main = async () => {
    console.time("Seeding complete 🌱");

    await prisma.invoice.createMany({
        skipDuplicates: false,
        data: [
            
              {
                customer_id: customers[1].id,
                amount: 20348,
                status: 'pending',
                date: '2022-11-14T00:00:00-00:00',
              },
              
              {
                customer_id: customers[3].id,
                amount: 44800,
                status: 'paid',
                date: '2023-09-10T00:00:00-00:00',
              },
              {
                customer_id: customers[5].id,
                amount: 34577,
                status: 'pending',
                date: '2023-08-05T00:00:00-00:00',
              },
              {
                customer_id: customers[2].id,
                amount: 54246,
                status: 'pending',
                date: '2023-07-16T00:00:00-00:00',
              },
              {
                customer_id: customers[0].id,
                amount: 666,
                status: 'pending',
                date: '2023-06-27T00:00:00-00:00',
              },
              {
                customer_id: customers[3].id,
                amount: 32545,
                status: 'paid',
                date: '2023-06-09T00:00:00-00:00',
              },
              {
                customer_id: customers[4].id,
                amount: 1250,
                status: 'paid',
                date: '2023-06-17T00:00:00-00:00',
              },
              {
                customer_id: customers[5].id,
                amount: 8546,
                status: 'paid',
                date: '2023-06-07T00:00:00-00:00',
              },
              {
                customer_id: customers[1].id,
                amount: 500,
                status: 'paid',
                date: '2023-08-19T00:00:00-00:00',
              },
              {
                customer_id: customers[5].id,
                amount: 8945,
                status: 'paid',
                date: '2023-06-03T00:00:00-00:00',
              },
              {
                customer_id: customers[2].id,
                amount: 1000,
                status: 'paid',
                date: '2022-06-05T00:00:00-00:00',
              },
        ],
    });

};

main()
    .then(() => {
        console.log("Process completed");
    })
    .catch((e) => console.log(e));