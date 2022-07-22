import React, { ChangeEvent, FC, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import { Controller, useForm } from "react-hook-form";

import {
  Box,
  Button,
  capitalize,
  Card,
  CardActions,
  CardMedia,
  Checkbox,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Grid,
  ListItem,
  Paper,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import {
  DriveFileRenameOutline,
  SaveOutlined,
  UploadOutlined,
} from "@mui/icons-material";

import { AdminLayout } from "../../../components/layouts";
import { IProduct } from "../../../interfaces";
import { dbProducts } from "../../../database";
import { tesloApi } from "../../../api";
import { Product } from "../../../models";

const validTypes = ["shirts", "pants", "hoodies", "hats"];
const validGender = ["men", "women", "kid", "unisex"];
const validSizes = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];

interface FormData {
  _id?: string;
  description: string;
  images: string[];
  inStock: number;
  price: number;
  sizes: string[];
  slug: string;
  tags: string[];
  title: string;
  type: string;
  gender: string;
}

interface Props {
  product: IProduct;
}

const ProductAdminPage: FC<Props> = ({ product }) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newTagValue, setNewTagValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
    getValues,
    setValue,
  } = useForm<FormData>({
    defaultValues: product,
  });

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      // console.log({ value, name, type });
      if (name === "title") {
        const newSlug =
          value.title
            ?.trim()
            .replaceAll(" ", "_")
            .replaceAll("'", "")
            .toLocaleLowerCase() || "";

        setValue("slug", newSlug);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  // const onChangeSize = (size: string) => {
  //   const currentSizes = getValues("sizes");
  //   if (currentSizes.includes(size)) {
  //     return setValue(
  //       "sizes",
  //       currentSizes.filter((s) => s !== size),
  //       { shouldValidate: true }
  //     );
  //   }
  //   setValue("sizes", [...currentSizes, size], { shouldValidate: true });
  // };

  const onNewTag = () => {
    const newTag = newTagValue.trim().toLocaleLowerCase();
    setNewTagValue("");
    const currentTags = getValues("tags");

    if (currentTags.includes(newTag)) {
      return;
    }

    currentTags.push(newTag);
  };

  const onDeleteTag = (tag: string) => {
    const updatedTags = getValues("tags").filter((t) => t !== tag);
    setValue("tags", updatedTags, { shouldValidate: true });
  };

  const onFilesSelected = async ({ target }: ChangeEvent<HTMLInputElement>) => {
    if (!target.files || target.files.length === 0) {
      return;
    }

    // console.log(target.files);

    try {
      for (const file of target.files) {
        const formData = new FormData();
        // console.log(file);
        formData.append("file", file);
        const { data } = await tesloApi.post<{ message: string }>(
          "/admin/upload",
          formData
        );
        // console.log(data.message);
        setValue("images", [...getValues("images"), data.message], {
          shouldValidate: true,
        });
      }
    } catch (error) {
      console.log({ error });
    }
  };

  const onDeleteImage = (image: string) => {
    setValue(
      "images",
      getValues("images").filter((img) => img !== image),
      { shouldValidate: true }
    );
  };

  const onSubmit = async (form: FormData) => {
    if (form.images.length < 2) return alert("Mínimo 2 imagenes");
    setIsSaving(true);

    try {
      const { data } = await tesloApi({
        url: "/admin/products",
        method: form._id ? "PUT" : "POST",
        data: form,
      });

      console.log({ data });
      if (!form._id) {
        router.replace(`/admin/products/${form.slug}`);
      } else {
        setIsSaving(false);
      }
    } catch (error) {
      console.log(error);
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout
      title={"Producto"}
      subTitle={`Editando: ${product.title}`}
      icon={<DriveFileRenameOutline />}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box display="flex" justifyContent="end" sx={{ mb: 1 }}>
          <Button
            color="secondary"
            startIcon={<SaveOutlined />}
            sx={{ width: "150px" }}
            type="submit"
            disabled={isSaving}
          >
            Guardar
          </Button>
        </Box>

        <Grid container spacing={2}>
          {/* Data */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="title"
              rules={{
                required: "Este campo es requerido",
                minLength: { value: 2, message: "Mínimo 2 caracteres" },
              }}
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Título"
                  variant="filled"
                  fullWidth
                  sx={{ mb: 1 }}
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
              )}
            />

            <Controller
              name="description"
              rules={{
                required: "Este campo es requerido",
              }}
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Descripción"
                  variant="filled"
                  fullWidth
                  multiline
                  sx={{ mb: 1 }}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              )}
            />

            <Controller
              name="inStock"
              rules={{
                required: "Este campo es requerido",
                min: { value: 0, message: "Mínimo de valor cero" },
              }}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Inventario"
                  variant="filled"
                  type="number"
                  fullWidth
                  sx={{ mb: 1 }}
                  error={!!errors.inStock}
                  helperText={errors.inStock?.message}
                />
              )}
            />

            <Controller
              name="price"
              rules={{
                required: "Este campo es requerido",
                min: { value: 0, message: "Mínimo de valor cero" },
              }}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Precio"
                  variant="filled"
                  type="number"
                  fullWidth
                  sx={{ mb: 1 }}
                  error={!!errors.price}
                  helperText={errors.price?.message}
                />
              )}
            />

            <Divider sx={{ my: 1 }} />

            <Controller
              name="type"
              control={control}
              defaultValue={undefined}
              render={({ field }) => (
                <FormControl>
                  <FormLabel>Tipo</FormLabel>
                  <RadioGroup row {...field}>
                    {validTypes.map((option) => (
                      <FormControlLabel
                        key={option}
                        value={option}
                        control={<Radio color="secondary" />}
                        label={capitalize(option)}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}
            />

            <Controller
              name="gender"
              control={control}
              defaultValue={undefined}
              render={({ field }) => (
                <FormControl>
                  <FormLabel>Género</FormLabel>
                  <RadioGroup row {...field}>
                    {validGender.map((option) => (
                      <FormControlLabel
                        key={option}
                        value={option}
                        control={<Radio color="secondary" />}
                        label={capitalize(option)}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}
            />

            <Controller
              name="sizes"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth margin="dense" error={!!errors.sizes}>
                  <FormLabel>Tallas</FormLabel>
                  <FormGroup>
                    {validSizes.map((size) => (
                      <FormControlLabel
                        key={size}
                        label={size}
                        control={
                          <Checkbox
                            value={size}
                            checked={field.value.some((val) => val === size)}
                            onChange={({ target: { value } }, checked) => {
                              checked
                                ? field.onChange([...field.value, value])
                                : field.onChange(
                                    field.value.filter((val) => val !== value)
                                  );
                            }}
                          />
                        }
                      />
                    ))}
                  </FormGroup>
                  <FormHelperText>
                    {capitalize(`${(errors.sizes as any)?.message || ""}`)}
                  </FormHelperText>
                </FormControl>
              )}
            />
          </Grid>

          {/* Tags e imagenes */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="slug"
              rules={{
                required: "Este campo es requerido",
                validate: (val) =>
                  val.trim().includes(" ")
                    ? "No puede tener espacios en blanco"
                    : undefined,
              }}
              control={control}
              defaultValue=""
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Slug - URL"
                  variant="filled"
                  fullWidth
                  sx={{ mb: 1 }}
                  error={!!errors.slug}
                  helperText={errors.slug?.message}
                />
              )}
            />

            <TextField
              label="Etiquetas"
              variant="filled"
              fullWidth
              sx={{ mb: 1 }}
              helperText="Presiona [spacebar] para agregar"
              value={newTagValue}
              onChange={({ target }) => setNewTagValue(target.value)}
              onKeyUp={({ code }) =>
                code === "Space" ? onNewTag() : undefined
              }
            />

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                listStyle: "none",
                p: 0,
                m: 0,
              }}
              component="ul"
            >
              {getValues("tags").map((tag) => {
                return (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => onDeleteTag(tag)}
                    color="primary"
                    size="small"
                    sx={{ ml: 1, mt: 1 }}
                  />
                );
              })}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box display="flex" flexDirection="column">
              <FormLabel sx={{ mb: 1 }}>Imágenes</FormLabel>
              <Button
                color="secondary"
                fullWidth
                startIcon={<UploadOutlined />}
                sx={{ mb: 3 }}
                onClick={() => fileInputRef.current?.click()}
              >
                Cargar imagen
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/png, image/gif, image/jpeg"
                style={{ display: "none" }}
                onChange={onFilesSelected}
              />

              <Chip
                label="Es necesario al menos 2 imagenes"
                color="error"
                variant="outlined"
                sx={{
                  display: getValues("images").length < 2 ? "flex" : "none",
                }}
              />

              <Grid container spacing={2}>
                {getValues("images").map((img) => (
                  <Grid item xs={4} sm={3} key={img}>
                    <Card>
                      <CardMedia
                        component="img"
                        className="fadeIn"
                        image={img}
                        alt={img}
                      />
                      <CardActions>
                        <Button
                          fullWidth
                          color="error"
                          onClick={() => onDeleteImage(img)}
                        >
                          Borrar
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Grid>
        </Grid>
      </form>
    </AdminLayout>
  );
};

// You should use getServerSideProps when:
// - Only if you need to pre-render a page whose data must be fetched at request time

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const { slug = "" } = query;

  let product: IProduct | null;

  if (slug === "new") {
    // Crear un producto}
    const tempProduct = JSON.parse(JSON.stringify(new Product()));
    delete tempProduct._id;
    tempProduct.images = ["img1.jpg", "img2.jpg"];
    product = tempProduct;
  } else {
    product = await dbProducts.getProductBySlug(slug.toString());
  }

  if (!product) {
    return {
      redirect: {
        destination: "/admin/products",
        permanent: false,
      },
    };
  }

  return {
    props: {
      product,
    },
  };
};

export default ProductAdminPage;
