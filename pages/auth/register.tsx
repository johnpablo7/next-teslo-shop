import { useContext, useState } from "react";
import { GetServerSideProps } from "next";
import { useRouter } from "next/router";

import NextLink from "next/link";
import { signIn, getSession } from "next-auth/react";

import { Controller, useForm } from "react-hook-form";
import {
  Box,
  Button,
  Chip,
  Grid,
  Link,
  TextField,
  Typography,
} from "@mui/material";
import { ErrorOutline } from "@mui/icons-material";

import { AuthContext } from "../../context";
import { AuthLayout } from "../../components/layouts";
import { validations } from "../../utils";
// import { tesloApi } from "../../api";

type FormData = {
  name: string;
  email: string;
  password: string;
};

const RegisterPage = () => {
  const router = useRouter();
  const { registerUser } = useContext(AuthContext);

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<FormData>();
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onRegisterForm = async ({ email, password, name }: FormData) => {
    setShowError(false);
    const { hasError, message } = await registerUser(name, email, password);

    if (hasError) {
      setShowError(true);
      setErrorMessage(message!);
      setTimeout(() => setShowError(false), 3000);
      return;
    }

    // Todo: navegar a la pantalla que el usuario estaba
    // const destination = router.query.p?.toString() || "/";
    // router.replace(destination);

    await signIn("credentials", { email, password });
  };

  return (
    <AuthLayout title={"Registrase"}>
      <form onSubmit={handleSubmit(onRegisterForm)} noValidate>
        <Box sx={{ width: 350, padding: "10px 20px" }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h1" component="h1">
                Crear cuenta
              </Typography>
              <Chip
                label="No reconocemos ese usuario / contraseña"
                color="error"
                icon={<ErrorOutline />}
                className="fadeIn"
                sx={{ display: showError ? "flex" : "none" }}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="name"
                rules={{
                  required: "Este campo es requerido",
                  minLength: { value: 2, message: "Mínimo 2 caracteres" },
                }}
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Nombre completo"
                    type="name"
                    variant="filled"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="email"
                rules={{
                  required: "Este campo es requerido",
                  validate: validations.isEmail,
                }}
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Correo"
                    type="email"
                    variant="filled"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Controller
                name="password"
                rules={{
                  required: "Este campo es requerido",
                  minLength: { value: 6, message: "Mínimo 6 caracteres" },
                }}
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Contraseña"
                    type="password"
                    variant="filled"
                    fullWidth
                    error={!!errors.password}
                    helperText={errors.password?.message}
                  />
                )}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                color="secondary"
                className="circular-btn"
                size="large"
                fullWidth
              >
                Ingresar
              </Button>
            </Grid>

            <Grid item xs={12} display="flex" justifyContent="end">
              <NextLink
                href={
                  router.query.p
                    ? `/auth/login?p=${router.query.p}`
                    : "/auth/login"
                }
                passHref
              >
                <Link underline="always">¿Ya tienes Cuenta?</Link>
              </NextLink>
            </Grid>
          </Grid>
        </Box>
      </form>
    </AuthLayout>
  );
};

// You should use getServerSideProps when:
// - Only if you need to pre-render a page whose data must be fetched at request time
export const getServerSideProps: GetServerSideProps = async ({
  req,
  query,
}) => {
  const session = await getSession({ req });
  // console.log({ session });

  const { p = "/" } = query;

  if (session) {
    return {
      redirect: {
        destination: p.toString(),
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
};

export default RegisterPage;
