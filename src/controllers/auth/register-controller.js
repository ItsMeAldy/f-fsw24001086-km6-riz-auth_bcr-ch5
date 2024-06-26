//! ----- create user ------
// TODO:
// data selain email & password ke tabel User
// data email & password ke tabel Auth

// create user & auth
const bcrypt = require("bcrypt");
const createHttpError = require("http-errors");
const { User, Auth } = require("../../databases/models");
const { randomUUID } = require("crypto");
const handleUploadImage = require("../../utils/handle_upload");

const register = async (req, res, next) => {
    try {
        const { email, password, confirmPassword, name, role } = req.body;
        const files = req.files;

        const images = {
            imagesUrl: [],
            imagesId: [],
        };

        const userExist = await Auth.findOne({
            where: {
                email,
            },
        });

        if (userExist) {
            return next(
                createHttpError(400, { message: "User email already taken" })
            );
        }

        // hashing password
        const saltRounds = 10;
        const hashedPassword = bcrypt.hashSync(password, saltRounds);
        const hashedConfirmPassword = bcrypt.hashSync(
            confirmPassword,
            saltRounds
        );

        if (files) {
            const { imagesUrl, imagesId } = await handleUploadImage(files);

            images.imagesUrl = imagesUrl;
            images.imagesId = imagesId;
        }

        const newUser = await User.create({
            id: randomUUID(),
            name,
            companyId: req.user.companyId,
            role,
            imageUrl: images.imagesUrl,
            imageId: images.imagesId,
        });

        const authUser = await Auth.create({
            id: randomUUID(),
            email,
            password: hashedPassword,
            confirmPassword: hashedConfirmPassword,
            userId: newUser.id,
        });

        res.status(201).json({
            status: true,
            message: "create user successfully!",
            data: {
                user: {
                    ...newUser,
                },
                auth: {
                    ...authUser,
                },
            },
        });
    } catch (error) {
        next(createHttpError(500, { message: error.message }));
    }
};

module.exports = {
    register,
};
