import express from "express";
import db from "@repo/db/client";

const app = express();

app.post("/hdfcWebhook", async (req, res) => {
  //TODO: Add zod validation here?
  //TODO: HDFC bank should ideally send us a secret so we know this is sent by them
  // Check if this request actually came from hdfc bank, use a webhook secret here
  const paymentInformation: { token: string; userId: string; amount: string } =
    {
      token: req.body.token,
      userId: req.body.user_identifier,
      amount: req.body.amount,
    };

  // Update balance in db, add txn

  // Another Method
  // issue occur for concurrent req like 0 + 400, 0+ 200;
  // user will have only 400
  // const balance = db.balance.findFirst({
  //   where: {
  //     userId: paymentInformation.userId,
  //   },
  // });

  // db.balance.update({
  //   where: {
  //     userId: paymentInformation.userId,
  //   },
  //   data: {
  //     amount: balance + paymentInformation.amount
  //   }
  // });

  try {
    await db.$transaction([
      db.balance.updateMany({
        where: {
          userId: Number(paymentInformation.userId),
        },
        data: {
          amount: {
            // You can also get this from your DB
            increment: Number(paymentInformation.amount),
          },
        },
      }),
      db.onRampTransaction.updateMany({
        where: {
          token: paymentInformation.token,
        },
        data: {
          status: "Success",
        },
      }),
    ]);

    res.json({
      message: "Captured",
    });
  } catch (err) {
    console.error(err);
    res.status(411).json({
      message: "Error while processing webhook",
    });
  }
});

app.listen(3003);
