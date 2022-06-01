import { Box } from "@mui/material";
import Head from "next/head";
import { FCC } from "../../types/fc";

interface Props {
  title: string;
}

export const AuthLayout: FCC<Props> = ({ children, title }) => {
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>

      <main>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="calc(100vh - 200px)"
        >
          {children}
        </Box>
      </main>
    </>
  );
};
